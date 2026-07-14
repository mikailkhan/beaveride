import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorMiddleware.js';
import { AuthService } from '../services/authService.js';
import type { JwtPayload } from '../services/authService.js';

// Extend Express Request namespace to hold the user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const authService = new AuthService();

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new HttpError(401, 'Authorization header is missing');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Invalid authorization format. Expected "Bearer <token>"');
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // If jwt.verify throws, we ensure it maps to a 401 response
    next(new HttpError(401, error instanceof Error ? error.message : 'Invalid token'));
  }
};
