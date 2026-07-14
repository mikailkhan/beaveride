import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { HttpError } from '../middleware/errorMiddleware.js';

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphens, and underscores'),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
}
