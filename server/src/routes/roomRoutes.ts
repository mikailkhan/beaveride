import { Router } from 'express';
import { RoomController } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const roomController = new RoomController();

export const roomRoutes = Router();

roomRoutes.post('/', requireAuth, roomController.createRoom);
roomRoutes.get('/', requireAuth, roomController.getUserRooms);
roomRoutes.get('/:id', requireAuth, roomController.getRoomDetails);
roomRoutes.post('/:id/join', requireAuth, roomController.joinRoom);
