import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { HttpError } from '../middleware/errorMiddleware.js';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(80, 'Username must be under 80 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphens, and underscores'),
  firstName: z.string().min(1, 'First name is required').max(120, 'First name must be under 120 characters'),
  lastName: z.string().max(120, 'Last name must be under 120 characters').default(''),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be under 128 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(120).optional(),
  lastName: z.string().max(120).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be under 128 characters'),
});

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const dto = registerSchema.parse(req.body);
    const result = await this.authService.register(dto);
    res.status(201).json({ data: result });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const dto = loginSchema.parse(req.body);
    const result = await this.authService.login(dto);
    res.status(200).json({ data: result });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const result = await this.authService.getCurrentUser(req.user.sub);
    res.status(200).json({ data: result });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const parsed = updateProfileSchema.parse(req.body);
    // Build a clean dto without undefined entries (required by exactOptionalPropertyTypes)
    const dto = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v !== undefined)
    ) as { firstName?: string; lastName?: string; email?: string };
    const user = await this.authService.updateProfile(req.user.sub, dto);
    res.status(200).json({ data: { user } });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const dto = changePasswordSchema.parse(req.body);
    await this.authService.changePassword(req.user.sub, dto);
    res.status(200).json({ message: 'Password changed successfully' });
  };
}
