import { Request, Response, NextFunction } from 'express';
import { taskRepository } from '../repositories/taskRepository.js';
import { taskManager } from '../services/taskManager.js';

export class TaskController {
  /**
   * GET /api/rooms/:roomId/tasks
   * Returns task history for a room.
   */
  async getRoomTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomIdStr = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
      const roomId = parseInt(roomIdStr || '', 10);
      if (isNaN(roomId)) {
        res.status(400).json({ message: 'Invalid room ID' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const tasks = await taskRepository.getTasksForRoom(roomId, limit, offset);
      res.json({ tasks, count: tasks.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/rooms/:roomId/tasks/active
   * Returns the currently active agent task in a room.
   */
  async getActiveRoomTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomIdStr = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
      const roomId = parseInt(roomIdStr || '', 10);
      if (isNaN(roomId)) {
        res.status(400).json({ message: 'Invalid room ID' });
        return;
      }

      const activeTask = await taskRepository.getActiveTaskForRoom(roomId);
      res.json({ activeTask: activeTask || null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/:taskId
   * Returns task details by task ID.
   */
  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      if (!taskId) {
        res.status(400).json({ message: 'Task ID is required' });
        return;
      }

      const task = await taskRepository.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rooms/:roomId/tasks/:taskId/cancel
   * Cancels an in-flight task via REST endpoint.
   */
  async cancelRoomTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      if (!taskId) {
        res.status(400).json({ message: 'Task ID is required' });
        return;
      }

      const task = await taskRepository.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      const cancelledInMemory = taskManager.cancelTask(taskId);
      if (!cancelledInMemory && (task.status === 'assigned' || task.status === 'planning' || task.status === 'waiting' || task.status === 'writing' || task.status === 'verifying')) {
        await taskRepository.updateTaskStatus(taskId, 'cancelled', 'cancelled', {
          completedAt: new Date(),
        });
      }

      res.json({
        success: true,
        message: 'Task cancelled successfully',
        taskId,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const taskController = new TaskController();
