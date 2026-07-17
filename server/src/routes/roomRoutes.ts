import { Router } from 'express';
import { RoomController } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const roomController = new RoomController();

export const roomRoutes = Router();

roomRoutes.post('/', requireAuth, roomController.createRoom);
roomRoutes.get('/', requireAuth, roomController.getUserRooms);
roomRoutes.get('/archived', requireAuth, roomController.getArchivedRooms);
roomRoutes.get('/shared', requireAuth, roomController.getSharedRooms);
roomRoutes.patch('/trash-all', requireAuth, roomController.trashAllRooms);
roomRoutes.get('/:id', requireAuth, roomController.getRoomDetails);
roomRoutes.post('/:id/join', requireAuth, roomController.joinRoom);
roomRoutes.patch('/:id/archive', requireAuth, roomController.archiveRoom);
roomRoutes.patch('/:id/trash', requireAuth, roomController.trashRoom);
roomRoutes.patch('/:id/restore', requireAuth, roomController.restoreRoom);
roomRoutes.delete('/:id', requireAuth, roomController.deleteRoom);
roomRoutes.post('/:id/run', requireAuth, roomController.runCode);
