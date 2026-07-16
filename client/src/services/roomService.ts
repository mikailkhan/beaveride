import { createApiClient } from './apiClient.js';
import type { Room, UserRoom } from '../types';

const api = createApiClient({
  getAccessToken: () => localStorage.getItem('beaveride_token'),
});

export interface ApiResponse<T> {
  data: T;
}

interface BackendRoom {
  id: number;
  title: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  status: any;
  role?: 'owner' | 'editor' | 'viewer';
  canRun?: boolean;
  members?: Array<{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: 'owner' | 'editor' | 'viewer';
    canRun: boolean;
    joinedAt: string;
  }>;
}

interface BackendUserRoom {
  id: number;
  userId: number;
  roomId: number;
  role: 'owner' | 'editor' | 'viewer';
  canRun: boolean;
  joinedAt: string;
  updatedAt: string;
}

const mapRoom = (room: BackendRoom): Room => ({
  id: String(room.id),
  title: room.title,
  language: room.language,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
  status: room.status,
  role: room.role,
  canRun: room.canRun,
  members: room.members?.map((m) => ({
    id: String(m.id),
    username: m.username,
    firstName: m.firstName,
    lastName: m.lastName,
    role: m.role,
    canRun: m.canRun,
    joinedAt: m.joinedAt,
  })),
});

const mapUserRoom = (ur: BackendUserRoom): UserRoom => ({
  id: String(ur.id),
  userId: String(ur.userId),
  roomId: String(ur.roomId),
  role: ur.role,
  canRun: ur.canRun,
  joinedAt: ur.joinedAt,
  updatedAt: ur.updatedAt,
});

class RoomService {
  async getRooms(): Promise<Room[]> {
    const response = await api.get<ApiResponse<BackendRoom[]>>('/api/rooms');
    return response.data.map(mapRoom);
  }

  async createRoom(title: string, language: string): Promise<Room> {
    const response = await api.post<ApiResponse<BackendRoom>>('/api/rooms', { title, language });
    return mapRoom(response.data);
  }

  async getRoomDetails(roomId: string): Promise<Room> {
    const response = await api.get<ApiResponse<BackendRoom>>(`/api/rooms/${roomId}`);
    return mapRoom(response.data);
  }

  async joinRoom(roomId: string): Promise<UserRoom> {
    const response = await api.post<ApiResponse<BackendUserRoom>>(`/api/rooms/${roomId}/join`);
    return mapUserRoom(response.data);
  }
}

export const roomService = new RoomService();
