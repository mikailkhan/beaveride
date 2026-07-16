import { create } from 'zustand';
import type { Room } from '../types';
import { roomService } from '../services/roomService.js';

interface RoomState {
  rooms: Room[];
  activeRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  fetchRooms: () => Promise<void>;
  createRoom: (title: string, language: string) => Promise<Room>;
  fetchRoomDetails: (roomId: string) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<void>;
  clearActiveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  isLoading: false,
  error: null,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),
  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await roomService.getRooms();
      set({ rooms, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch rooms', isLoading: false });
    }
  },
  createRoom: async (title: string, language: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await roomService.createRoom(title, language);
      set((state) => ({
        rooms: [room, ...state.rooms],
        isLoading: false,
      }));
      return room;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },
  fetchRoomDetails: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const roomDetails = await roomService.getRoomDetails(roomId);
      set({ activeRoom: roomDetails, isLoading: false });
      return roomDetails;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch room details';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },
  joinRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      await roomService.joinRoom(roomId);
      const rooms = await roomService.getRooms();
      set({ rooms, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to join room', isLoading: false });
      throw err;
    }
  },
  clearActiveRoom: () => set({ activeRoom: null, error: null }),
}));
