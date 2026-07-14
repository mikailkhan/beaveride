import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorMiddleware.js';
import { UserRepository } from '../repositories/userRepository.js';
import type { User } from '../repositories/userRepository.js';

const BCRYPT_ROUNDS = 12;

export type SafeUser = Omit<User, 'passwordHash'>;

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export interface CurrentUserResult {
  user: SafeUser;
}

type RegisterDto = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
};

type LoginDto = {
  email: string;
  password: string;
};

const toSafeUser = ({ passwordHash: _passwordHash, ...rest }: User): SafeUser => rest;

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(dto.email),
      this.userRepository.findByUsername(dto.username),
    ]);

    if (existingEmail) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    if (existingUsername) {
      throw new HttpError(409, 'This username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
    });

    const safeUser = toSafeUser(user);
    const token = this.signToken(safeUser);

    return { user: safeUser, token };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(dto.email);

    // Deliberately vague error: do not reveal whether the email exists
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const safeUser = toSafeUser(user);
    const token = this.signToken(safeUser);

    return { user: safeUser, token };
  }

  async getCurrentUser(userId: number): Promise<CurrentUserResult> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return { user: toSafeUser(user) };
  }

  verifyToken(token: string): JwtPayload {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === 'string' || !('sub' in payload) || !('email' in payload)) {
      throw new HttpError(401, 'Invalid token payload');
    }

    return { sub: payload.sub as unknown as number, email: payload.email as string };
  }

  private signToken(user: SafeUser): string {
    // Cast through unknown: env.JWT_EXPIRES_IN is a plain `string` but @types/jsonwebtoken
    // uses a branded StringValue. The value is always a valid ms-compatible string (Zod default '7d').
    const signOptions = { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions;
    return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, signOptions);
  }
}
