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
  language: string;
  createdAt: string;
  updatedAt: string;
  status: RoomStatus;
  role?: 'owner' | 'editor' | 'viewer';
  canRun?: boolean;
  members?: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'owner' | 'editor' | 'viewer';
    canRun: boolean;
    joinedAt: string;
  }>;
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
