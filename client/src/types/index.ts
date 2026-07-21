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

export type FileNodeType = 'file' | 'directory';

export interface ProjectFile {
  id: string;
  roomId: string;
  parentId: string | null;
  name: string;
  type: FileNodeType;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileTab {
  id: string;           // ProjectFile.id
  name: string;         // filename for display
  language: string;     // Monaco language id (e.g., 'javascript', 'python', 'go')
}
