import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const authController = new AuthController();

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, authController.register);
authRoutes.post('/login', authRateLimiter, authController.login);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.patch('/me', requireAuth, authController.updateProfile);
authRoutes.patch('/me/password', requireAuth, authController.changePassword);
