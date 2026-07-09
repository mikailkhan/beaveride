export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export type RoomStatus = 'active' | 'archived' | 'trash' | 'deleted';

export interface Room {
  id: string;
  title: string;
  progLangId: number;
  createdAt: string;
  updatedAt: string;
  status: RoomStatus;
}

export interface UserRoom {
  id: string;
  userId: string;
  roomId: string;
  role: 'owner' | 'editor' | 'viewer';
  canRun: boolean;
  joinedAt: string;
  updatedAt: string;
}
