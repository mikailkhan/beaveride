import { HttpError } from '../middleware/errorMiddleware.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';

export class RoomService {
  constructor(
    private readonly roomRepository = new RoomRepository(),
    private readonly fileRepository = new FileRepository()
  ) {}

  private getDefaultFile(language: string) {
    const clean = language.trim().toLowerCase();
    switch (clean) {
      case 'python':
        return { name: 'main.py', content: '# Python 3\nprint("Hello, World!")\n' };
      case 'go':
        return { name: 'main.go', content: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}\n' };
      default:
        return { name: 'main.js', content: '// JavaScript\nconsole.log("Hello, World!");\n' };
    }
  }

  async createRoom(userId: number, title: string, languageName: string) {
    const cleanLanguageName = languageName.trim().toLowerCase();
    const language = await this.roomRepository.findLanguageByName(cleanLanguageName);
    if (!language) {
      throw new HttpError(400, `Unsupported programming language: ${languageName}`);
    }

    const status = await this.roomRepository.findStatusByState('active');
    if (!status) {
      throw new HttpError(500, 'Reference status "active" not found in database');
    }

    const room = await this.roomRepository.create(title, language.id, status.id);

    // Creator is assigned the 'owner' role and canRun is set to true
    await this.roomRepository.addMember(room.id, userId, 'owner', true);

    // Seed default starter file
    const defaultFile = this.getDefaultFile(language.language);
    await this.fileRepository.createFile({
      roomId: room.id,
      parentId: null,
      name: defaultFile.name,
      type: 'file',
      content: defaultFile.content,
    });

    return {
      id: room.id,
      title: room.title,
      language: language.language,
      status: status.state,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  async getUserRooms(userId: number) {
    return this.roomRepository.findByUserId(userId);
  }

  async getArchivedRooms(userId: number) {
    return this.roomRepository.findArchivedByUserId(userId);
  }

  async getSharedRooms(userId: number) {
    return this.roomRepository.findSharedByUserId(userId);
  }

  async getRoomDetails(userId: number, roomId: number) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    const membership = await this.roomRepository.findMembership(roomId, userId);
    if (!membership) {
      throw new HttpError(403, 'You are not a member of this room');
    }

    const members = await this.roomRepository.findMembers(roomId);

    return {
      id: room.id,
      title: room.title,
      language: room.programmingLanguage.language,
      status: room.status.state,
      role: membership.role,
      canRun: membership.canRun,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      members,
    };
  }

  async joinRoom(userId: number, roomId: number) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    const existingMembership = await this.roomRepository.findMembership(roomId, userId);
    if (existingMembership) {
      return existingMembership;
    }

    // Default joining role is 'editor' with canRun set to true
    return this.roomRepository.addMember(roomId, userId, 'editor', true);
  }

  private async requireOwner(userId: number, roomId: number) {
    const membership = await this.roomRepository.findMembership(roomId, userId);
    if (!membership || membership.role !== 'owner') {
      throw new HttpError(403, 'Only the room owner can perform this action');
    }
    return membership;
  }

  async archiveRoom(userId: number, roomId: number) {
    await this.requireOwner(userId, roomId);
    const status = await this.roomRepository.findStatusByState('archived');
    if (!status) throw new HttpError(500, 'Status "archived" not found');
    await this.roomRepository.updateStatus(roomId, status.id);
  }

  async trashRoom(userId: number, roomId: number) {
    await this.requireOwner(userId, roomId);
    const status = await this.roomRepository.findStatusByState('trash');
    if (!status) throw new HttpError(500, 'Status "trash" not found');
    await this.roomRepository.updateStatus(roomId, status.id);
  }

  async restoreRoom(userId: number, roomId: number) {
    await this.requireOwner(userId, roomId);
    const status = await this.roomRepository.findStatusByState('active');
    if (!status) throw new HttpError(500, 'Status "active" not found');
    await this.roomRepository.updateStatus(roomId, status.id);
  }

  async deleteRoom(userId: number, roomId: number) {
    await this.requireOwner(userId, roomId);
    await this.roomRepository.deleteRoom(roomId);
  }

  async trashAllRooms(userId: number) {
    const status = await this.roomRepository.findStatusByState('trash');
    if (!status) throw new HttpError(500, 'Status "trash" not found');
    await this.roomRepository.trashAllOwnerRooms(userId, status.id);
  }

  async updateMemberRole(ownerUserId: number, roomId: number, targetUserId: number, role: 'owner' | 'editor' | 'viewer') {
    await this.requireOwner(ownerUserId, roomId);
    if (ownerUserId === targetUserId) {
      throw new HttpError(400, 'Owner cannot change their own role');
    }
    const targetMembership = await this.roomRepository.findMembership(roomId, targetUserId);
    if (!targetMembership) {
      throw new HttpError(404, 'Member not found in this room');
    }
    await this.roomRepository.updateMemberRole(roomId, targetUserId, role);
  }

  async toggleMemberCanRun(ownerUserId: number, roomId: number, targetUserId: number, canRun: boolean) {
    await this.requireOwner(ownerUserId, roomId);
    const targetMembership = await this.roomRepository.findMembership(roomId, targetUserId);
    if (!targetMembership) {
      throw new HttpError(404, 'Member not found in this room');
    }
    await this.roomRepository.updateMemberCanRun(roomId, targetUserId, canRun);
  }

  async kickMember(ownerUserId: number, roomId: number, targetUserId: number) {
    await this.requireOwner(ownerUserId, roomId);
    if (ownerUserId === targetUserId) {
      throw new HttpError(400, 'Owner cannot kick themselves from room');
    }
    const targetMembership = await this.roomRepository.findMembership(roomId, targetUserId);
    if (!targetMembership) {
      throw new HttpError(404, 'Member not found in this room');
    }
    await this.roomRepository.removeMember(roomId, targetUserId);
  }
}
