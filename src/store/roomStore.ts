import { create } from 'zustand';
import type { Room } from '../types';

interface RoomState {
  rooms: Room[];
  activeRoom: Room | null;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
}));
