import type { Request, Response } from 'express';
import { z } from 'zod';
import { FileService } from '../services/fileService.js';
import { HttpError } from '../middleware/errorMiddleware.js';

const createNodeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be under 255 characters')
    .refine((val) => !/[\\/]/.test(val), 'Name cannot contain slashes'),
  type: z.enum(['file', 'directory']),
  parentId: z.number().nullable().optional(),
  content: z.string().optional(),
});

const renameNodeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be under 255 characters')
    .refine((val) => !/[\\/]/.test(val), 'Name cannot contain slashes'),
});

const roomParamsSchema = z.object({
  roomId: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
});

const fileParamsSchema = z.object({
  roomId: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
  fileId: z.string().regex(/^\d+$/, 'File ID must be a valid number').transform(Number),
});

export class FileController {
  constructor(private readonly fileService = new FileService()) {}

  getFileTree = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId } = roomParamsSchema.parse(req.params);
    const files = await this.fileService.getFileTree(req.user.sub, roomId);
    res.status(200).json({ data: files });
  };

  createNode = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId } = roomParamsSchema.parse(req.params);
    const { name, type, parentId, content } = createNodeSchema.parse(req.body);
    const node = await this.fileService.createFile(
      req.user.sub,
      roomId,
      parentId ?? null,
      name,
      type,
      content
    );
    res.status(201).json({ data: node });
  };

  getFileContent = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    const file = await this.fileService.getFileContent(req.user.sub, roomId, fileId);
    res.status(200).json({ data: file });
  };

  updateFileContent = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    
    // We expect the body to be text content or json object with content property.
    // If it's a JSON content body:
    const updateSchema = z.object({
      content: z.string(),
    });
    const { content } = updateSchema.parse(req.body);
    
    await this.fileService.updateFileContent(req.user.sub, roomId, fileId, content);
    res.status(200).json({ message: 'File content updated successfully' });
  };

  renameNode = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    const { name } = renameNodeSchema.parse(req.body);
    await this.fileService.renameFile(req.user.sub, roomId, fileId, name);
    res.status(200).json({ message: 'File/directory renamed successfully' });
  };

  moveNode = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    const moveSchema = z.object({
      targetParentId: z.number().nullable(),
    });
    const { targetParentId } = moveSchema.parse(req.body);
    await this.fileService.moveFile(req.user.sub, roomId, fileId, targetParentId);
    res.status(200).json({ message: 'File/directory moved successfully' });
  };
  deleteNode = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    await this.fileService.deleteFile(req.user.sub, roomId, fileId);
    res.status(200).json({ message: 'File/directory deleted successfully' });
  };
}
