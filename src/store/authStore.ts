import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  setAuth: (user, token) => set({ isAuthenticated: true, user, token }),
  logout: () => set({ isAuthenticated: false, user: null, token: null }),
}));
