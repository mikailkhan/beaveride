import type { Request, Response } from 'express';
import { z } from 'zod';
import { RoomService } from '../services/roomService.js';
import { ExecutorService } from '../services/executorService.js';
import { HttpError } from '../middleware/errorMiddleware.js';

const createRoomSchema = z.object({
  title: z
    .string()
    .min(1, 'Room title is required')
    .max(160, 'Room title must be under 160 characters'),
  language: z.string().min(1, 'Programming language is required'),
});

const roomParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
});

export class RoomController {
  constructor(
    private readonly roomService = new RoomService(),
    private readonly executorService = new ExecutorService()
  ) {}

  createRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { title, language } = createRoomSchema.parse(req.body);
    const room = await this.roomService.createRoom(req.user.sub, title, language);
    res.status(201).json({ data: room });
  };

  getUserRooms = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const rooms = await this.roomService.getUserRooms(req.user.sub);
    res.status(200).json({ data: rooms });
  };

  getArchivedRooms = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const rooms = await this.roomService.getArchivedRooms(req.user.sub);
    res.status(200).json({ data: rooms });
  };

  getSharedRooms = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const rooms = await this.roomService.getSharedRooms(req.user.sub);
    res.status(200).json({ data: rooms });
  };

  getRoomDetails = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const roomDetails = await this.roomService.getRoomDetails(req.user.sub, roomId);
    res.status(200).json({ data: roomDetails });
  };

  joinRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const membership = await this.roomService.joinRoom(req.user.sub, roomId);
    res.status(200).json({ data: membership });
  };

  archiveRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.archiveRoom(req.user.sub, roomId);
    res.status(200).json({ message: 'Room archived successfully' });
  };

  trashRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.trashRoom(req.user.sub, roomId);
    res.status(200).json({ message: 'Room moved to trash successfully' });
  };

  restoreRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.restoreRoom(req.user.sub, roomId);
    res.status(200).json({ message: 'Room restored successfully' });
  };

  deleteRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.deleteRoom(req.user.sub, roomId);
    res.status(200).json({ message: 'Room permanently deleted' });
  };

  trashAllRooms = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    await this.roomService.trashAllRooms(req.user.sub);
    res.status(200).json({ message: 'All active owner rooms moved to trash' });
  };

  runCode = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new HttpError(401, 'Unauthorized');
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const { code, language } = z.object({
      code: z.string(),
      language: z.string().optional()
    }).parse(req.body);
    const roomDetails = await this.roomService.getRoomDetails(req.user.sub, roomId);
    if (!roomDetails.canRun) {
      throw new HttpError(403, 'You do not have execution privileges in this room');
    }
    const executionLang = (language && ['javascript', 'python', 'go'].includes(language.toLowerCase()))
      ? language.toLowerCase()
      : roomDetails.language;

    const output = await this.executorService.executeCode(executionLang, code);
    res.status(200).json({ output });
  };
}
