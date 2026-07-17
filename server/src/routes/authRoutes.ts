import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const authController = new AuthController();

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.patch('/me', requireAuth, authController.updateProfile);
authRoutes.patch('/me/password', requireAuth, authController.changePassword);
