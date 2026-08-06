import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const taskRoutes = Router();

// Room-scoped task endpoints
taskRoutes.get('/rooms/:roomId/tasks', requireAuth, (req, res, next) => taskController.getRoomTasks(req, res, next));
taskRoutes.get('/rooms/:roomId/tasks/active', requireAuth, (req, res, next) => taskController.getActiveRoomTask(req, res, next));
taskRoutes.post('/rooms/:roomId/tasks/:taskId/cancel', requireAuth, (req, res, next) => taskController.cancelRoomTask(req, res, next));

// Global task endpoint
taskRoutes.get('/tasks/:taskId', requireAuth, (req, res, next) => taskController.getTaskById(req, res, next));
