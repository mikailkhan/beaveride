import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setInitializing: (isInitializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isInitializing: true,
  setAuth: (user, token) => {
    localStorage.setItem('beaveride_token', token);
    set({ isAuthenticated: true, user, token, isInitializing: false });
  },
  logout: () => {
    localStorage.removeItem('beaveride_token');
    set({ isAuthenticated: false, user: null, token: null, isInitializing: false });
  },
  setInitializing: (isInitializing) => set({ isInitializing }),
}));

