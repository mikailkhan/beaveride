import type { Request, Response } from 'express';
import { z } from 'zod';
import { RoomService } from '../services/roomService.js';
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
  constructor(private readonly roomService = new RoomService()) {}

  createRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const { title, language } = createRoomSchema.parse(req.body);
    const room = await this.roomService.createRoom(req.user.sub, title, language);

    res.status(201).json({ data: room });
  };

  getUserRooms = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const rooms = await this.roomService.getUserRooms(req.user.sub);
    res.status(200).json({ data: rooms });
  };

  getRoomDetails = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const { id: roomId } = roomParamsSchema.parse(req.params);
    const roomDetails = await this.roomService.getRoomDetails(req.user.sub, roomId);

    res.status(200).json({ data: roomDetails });
  };

  joinRoom = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const { id: roomId } = roomParamsSchema.parse(req.params);
    const membership = await this.roomService.joinRoom(req.user.sub, roomId);

    res.status(200).json({ data: membership });
  };
}
