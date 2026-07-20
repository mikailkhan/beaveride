import { FileRepository } from '../repositories/fileRepository.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { HttpError } from '../middleware/errorMiddleware.js';

export class FileService {
  constructor(
    private readonly fileRepository = new FileRepository(),
    private readonly roomRepository = new RoomRepository()
  ) {}

  private async requireMembership(userId: number, roomId: number) {
    const membership = await this.roomRepository.findMembership(roomId, userId);
    if (!membership) {
      throw new HttpError(403, 'You are not a member of this room');
    }
    return membership;
  }

  private async requireWriteAccess(userId: number, roomId: number) {
    const membership = await this.requireMembership(userId, roomId);
    if (membership.role === 'viewer') {
      throw new HttpError(403, 'You do not have write access to this room');
    }
    return membership;
  }

  async getFileTree(userId: number, roomId: number) {
    await this.requireMembership(userId, roomId);
    return this.fileRepository.getFileTree(roomId);
  }

  async createFile(
    userId: number,
    roomId: number,
    parentId: number | null,
    name: string,
    type: 'file' | 'directory',
    content?: string
  ) {
    await this.requireWriteAccess(userId, roomId);

    if (!name || name.trim().length === 0) {
      throw new HttpError(400, 'File/directory name cannot be empty');
    }

    if (parentId !== null) {
      const parent = await this.fileRepository.getFileById(parentId);
      if (!parent || parent.roomId !== roomId) {
        throw new HttpError(400, 'Parent directory does not exist in this room');
      }
      if (parent.type !== 'directory') {
        throw new HttpError(400, 'Parent must be a directory');
      }
    }

    const fileData: {
      roomId: number;
      parentId: number | null;
      name: string;
      type: 'file' | 'directory';
      content?: string;
    } = {
      roomId,
      parentId,
      name: name.trim(),
      type,
    };

    if (content !== undefined) {
      fileData.content = content;
    }

    return this.fileRepository.createFile(fileData);
  }

  async getFileContent(userId: number, roomId: number, fileId: number) {
    await this.requireMembership(userId, roomId);
    const file = await this.fileRepository.getFileById(fileId);
    if (!file || file.roomId !== roomId) {
      throw new HttpError(404, 'File not found');
    }
    if (file.type !== 'file') {
      throw new HttpError(400, 'Cannot get content of a directory');
    }
    return file;
  }

  async updateFileContent(userId: number, roomId: number, fileId: number, content: string) {
    await this.requireWriteAccess(userId, roomId);
    const file = await this.fileRepository.getFileById(fileId);
    if (!file || file.roomId !== roomId) {
      throw new HttpError(404, 'File not found');
    }
    if (file.type !== 'file') {
      throw new HttpError(400, 'Cannot update content of a directory');
    }
    await this.fileRepository.updateFileContent(fileId, content);
  }

  async renameFile(userId: number, roomId: number, fileId: number, newName: string) {
    await this.requireWriteAccess(userId, roomId);

    if (!newName || newName.trim().length === 0) {
      throw new HttpError(400, 'New name cannot be empty');
    }

    const file = await this.fileRepository.getFileById(fileId);
    if (!file || file.roomId !== roomId) {
      throw new HttpError(404, 'File/directory not found');
    }

    await this.fileRepository.renameFile(fileId, newName.trim());
  }

  async deleteFile(userId: number, roomId: number, fileId: number) {
    await this.requireWriteAccess(userId, roomId);
    const file = await this.fileRepository.getFileById(fileId);
    if (!file || file.roomId !== roomId) {
      throw new HttpError(404, 'File/directory not found');
    }

    if (file.type === 'directory') {
      await this.deleteDirectoryRecursively(roomId, fileId);
    } else {
      await this.fileRepository.deleteFile(fileId);
    }
  }

  private async deleteDirectoryRecursively(roomId: number, dirId: number) {
    const allFiles = await this.fileRepository.getFileTree(roomId);

    const childrenMap = new Map<number, number[]>();
    for (const f of allFiles) {
      if (f.parentId !== null) {
        if (!childrenMap.has(f.parentId)) {
          childrenMap.set(f.parentId, []);
        }
        childrenMap.get(f.parentId)!.push(f.id);
      }
    }

    const toDelete: number[] = [];
    const traverse = (currentId: number) => {
      const children = childrenMap.get(currentId) || [];
      for (const childId of children) {
        traverse(childId);
      }
      toDelete.push(currentId);
    };

    traverse(dirId);

    for (const id of toDelete) {
      await this.fileRepository.deleteFile(id);
    }
  }
}
