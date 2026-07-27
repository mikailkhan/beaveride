import type { Room } from '../../types';

class MockRoomService {
  private mockRooms: Room[] = [
    {
      id: 'r1',
      title: 'Interview Sandbox',
      language: 'javascript',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'r2',
      title: 'React Components Pair Programming',
      language: 'typescript',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'active',
    },
  ];

  async getRooms(): Promise<Room[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockRooms]), 500);
    });
  }

  async getRoom(id: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const room = this.mockRooms.find((r) => r.id === id);
        if (room) resolve(room);
        else reject(new Error('Room not found'));
      }, 500);
    });
  }

  async createRoom(title: string, language: string): Promise<Room> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRoom: Room = {
          id: `r${Date.now()}`,
          title,
          language,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        };
        this.mockRooms.push(newRoom);
        resolve(newRoom);
      }, 500);
    });
  }
}

export const mockRoomService = new MockRoomService();
