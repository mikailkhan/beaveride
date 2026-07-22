import { createApiClient } from './apiClient.js';
import type { ProjectFile } from '../types';

const api = createApiClient({
  getAccessToken: () => localStorage.getItem('beaveride_token'),
});

export interface ApiResponse<T> {
  data: T;
}

interface BackendProjectFile {
  id: number;
  roomId: number;
  parentId: number | null;
  name: string;
  type: 'file' | 'directory';
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapProjectFile = (file: BackendProjectFile): ProjectFile => ({
  id: String(file.id),
  roomId: String(file.roomId),
  parentId: file.parentId !== null ? String(file.parentId) : null,
  name: file.name,
  type: file.type,
  content: file.content,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

export class FileService {
  async getFileTree(roomId: string): Promise<ProjectFile[]> {
    const response = await api.get<ApiResponse<BackendProjectFile[]>>(`/api/rooms/${roomId}/files`);
    return response.data.map(mapProjectFile);
  }

  async createNode(
    roomId: string,
    data: {
      name: string;
      type: 'file' | 'directory';
      parentId?: string;
      content?: string;
    }
  ): Promise<ProjectFile> {
    const payload = {
      name: data.name,
      type: data.type,
      parentId: data.parentId ? Number(data.parentId) : null,
      content: data.content,
    };
    const response = await api.post<ApiResponse<BackendProjectFile>>(`/api/rooms/${roomId}/files`, payload);
    return mapProjectFile(response.data);
  }

  async getFileContent(roomId: string, fileId: string): Promise<ProjectFile> {
    const response = await api.get<ApiResponse<BackendProjectFile>>(`/api/rooms/${roomId}/files/${fileId}`);
    return mapProjectFile(response.data);
  }

  async updateFileContent(roomId: string, fileId: string, content: string): Promise<void> {
    await api.put(`/api/rooms/${roomId}/files/${fileId}`, { content });
  }

  async renameNode(roomId: string, fileId: string, name: string): Promise<void> {
    await api.patch(`/api/rooms/${roomId}/files/${fileId}/rename`, { name });
  }

  async moveNode(roomId: string, fileId: string, targetParentId: string | null): Promise<void> {
    await api.patch(`/api/rooms/${roomId}/files/${fileId}/move`, {
      targetParentId: targetParentId ? Number(targetParentId) : null,
    });
  }

  async deleteNode(roomId: string, fileId: string): Promise<void> {
    await api.delete(`/api/rooms/${roomId}/files/${fileId}`);
  }
}

export const fileService = new FileService();
