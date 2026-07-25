import type { Request, Response } from 'express';
import { z } from 'zod';
import * as Y from 'yjs';
import { RoomService } from '../services/roomService.js';
import { ExecutorService } from '../services/executorService.js';
import { FileService } from '../services/fileService.js';
import { getOrCreateDoc } from '../sockets/docStore.js';
import { HttpError } from '../middleware/errorMiddleware.js';
import { requireUser } from '../middleware/authMiddleware.js';
import { buildProjectPayload } from '../utils/filePathUtils.js';

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
    private readonly executorService = new ExecutorService(),
    private readonly fileService = new FileService()
  ) {}

  createRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { title, language } = createRoomSchema.parse(req.body);
    const room = await this.roomService.createRoom(user.sub, title, language);
    res.status(201).json({ data: room });
  };

  getUserRooms = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const rooms = await this.roomService.getUserRooms(user.sub);
    res.status(200).json({ data: rooms });
  };

  getArchivedRooms = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const rooms = await this.roomService.getArchivedRooms(user.sub);
    res.status(200).json({ data: rooms });
  };

  getSharedRooms = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const rooms = await this.roomService.getSharedRooms(user.sub);
    res.status(200).json({ data: rooms });
  };

  getRoomDetails = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const roomDetails = await this.roomService.getRoomDetails(user.sub, roomId);
    res.status(200).json({ data: roomDetails });
  };

  joinRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const membership = await this.roomService.joinRoom(user.sub, roomId);
    res.status(200).json({ data: membership });
  };

  archiveRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.archiveRoom(user.sub, roomId);
    res.status(200).json({ message: 'Room archived successfully' });
  };

  trashRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.trashRoom(user.sub, roomId);
    res.status(200).json({ message: 'Room moved to trash successfully' });
  };

  restoreRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.restoreRoom(user.sub, roomId);
    res.status(200).json({ message: 'Room restored successfully' });
  };

  deleteRoom = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    await this.roomService.deleteRoom(user.sub, roomId);
    res.status(200).json({ message: 'Room permanently deleted' });
  };

  trashAllRooms = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    await this.roomService.trashAllRooms(user.sub);
    res.status(200).json({ message: 'All active owner rooms moved to trash' });
  };

  runCode = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id: roomId } = roomParamsSchema.parse(req.params);
    const { code, language, entryFileId } = z.object({
      code: z.string().optional(),
      language: z.string().optional(),
      entryFileId: z.string().optional(),
    }).parse(req.body);
    const roomDetails = await this.roomService.getRoomDetails(user.sub, roomId);
    if (!roomDetails.canRun) {
      throw new HttpError(403, 'You do not have execution privileges in this room');
    }
    const executionLang = (language && ['javascript', 'python', 'go'].includes(language.toLowerCase()))
      ? language.toLowerCase()
      : roomDetails.language;

    const allFiles = await this.fileService.getFileTree(user.sub, roomId);
    const yDoc = await getOrCreateDoc(roomId);
    const yFilesMap = yDoc.getMap('files');

    const { payload: projectPayload, entryFilePath } = buildProjectPayload(allFiles, yFilesMap, entryFileId ? String(entryFileId) : undefined);

    // If project payload is completely empty (e.g. no files in tree yet), fallback to single code string
    if (projectPayload.length === 0 && code) {
      const output = await this.executorService.executeCode(executionLang, code);
      res.status(200).json({ output });
      return;
    }

    const output = await this.executorService.executeProject(executionLang, projectPayload, entryFilePath);
    res.status(200).json({ output });
  };
}
