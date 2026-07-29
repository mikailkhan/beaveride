import type { Request, Response } from 'express';
import { z } from 'zod';
import { eventService, EventService } from '../services/eventService.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { HttpError } from '../middleware/errorMiddleware.js';
import { requireUser } from '../middleware/authMiddleware.js';

const roomParamsSchema = z.object({
  roomId: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
});

const fileParamsSchema = z.object({
  roomId: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
  fileId: z.string().regex(/^\d+$/, 'File ID must be a valid number').transform(Number),
});

const correlationParamsSchema = z.object({
  roomId: z.string().regex(/^\d+$/, 'Room ID must be a valid number').transform(Number),
  correlationId: z.string().uuid('Correlation ID must be a valid UUID'),
});

const activityQuerySchema = z.object({
  actorId: z.string().regex(/^\d+$/).transform(Number).optional(),
  actorType: z.enum(['human', 'agent', 'system']).optional(),
  fileId: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventType: z.string().optional(),
  outcome: z.string().optional(),
  fromTime: z.string().transform((str) => new Date(str)).optional(),
  toTime: z.string().transform((str) => new Date(str)).optional(),
  correlationId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export class ActivityController {
  constructor(
    private readonly service: EventService = eventService,
    private readonly roomRepository = new RoomRepository()
  ) {}

  private async assertRoomMember(roomId: number, userId: number): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new HttpError(404, 'Room not found');
    }
    const membership = await this.roomRepository.findMembership(roomId, userId);
    if (!membership) {
      throw new HttpError(403, 'You are not a member of this room');
    }
  }

  getActivityEvents = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { roomId } = roomParamsSchema.parse(req.params);
    await this.assertRoomMember(roomId, user.sub);

    const query = activityQuerySchema.parse(req.query);

    const result = await this.service.queryByRoom(
      roomId,
      {
        actorId: query.actorId,
        actorType: query.actorType,
        fileId: query.fileId,
        eventType: query.eventType as any,
        outcome: query.outcome as any,
        fromTime: query.fromTime,
        toTime: query.toTime,
        correlationId: query.correlationId,
      },
      {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      }
    );

    res.status(200).json({ data: result.events, total: result.total });
  };

  exportActivityEvents = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { roomId } = roomParamsSchema.parse(req.params);
    await this.assertRoomMember(roomId, user.sub);

    const events = await this.service.exportByRoom(roomId);
    res.status(200).json(events);
  };

  getFileActivityEvents = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { roomId, fileId } = fileParamsSchema.parse(req.params);
    await this.assertRoomMember(roomId, user.sub);

    const events = await this.service.queryByFile(roomId, fileId);
    res.status(200).json({ data: events });
  };

  getCorrelationActivityEvents = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { roomId, correlationId } = correlationParamsSchema.parse(req.params);
    await this.assertRoomMember(roomId, user.sub);

    const events = await this.service.queryByCorrelation(correlationId);
    res.status(200).json({ data: events });
  };
}
