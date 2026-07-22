import { Router } from 'express';
import { FileController } from '../controllers/fileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const fileController = new FileController();

export const fileRoutes = Router();

fileRoutes.get('/:roomId/files', requireAuth, fileController.getFileTree);
fileRoutes.post('/:roomId/files', requireAuth, fileController.createNode);
fileRoutes.get('/:roomId/files/:fileId', requireAuth, fileController.getFileContent);
fileRoutes.put('/:roomId/files/:fileId', requireAuth, fileController.updateFileContent);
fileRoutes.patch('/:roomId/files/:fileId/rename', requireAuth, fileController.renameNode);
fileRoutes.patch('/:roomId/files/:fileId/move', requireAuth, fileController.moveNode);
fileRoutes.delete('/:roomId/files/:fileId', requireAuth, fileController.deleteNode);
