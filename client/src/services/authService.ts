import { createApiClient } from './apiClient.js';
import type { User } from '../types';

// Create API client. The token is fetched from localStorage to avoid circular imports with authStore.
const api = createApiClient({
  getAccessToken: () => localStorage.getItem('beaveride_token'),
});

export interface ApiResponse<T> {
  data: T;
}

export interface AuthResponseData {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export interface CurrentUserResponseData {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Helper to map backend user object (with numeric id) to frontend User interface
const mapUser = (backendUser: { id: number; email: string; firstName: string; lastName: string; username: string }): User => ({
  id: String(backendUser.id),
  email: backendUser.email,
  firstName: backendUser.firstName,
  lastName: backendUser.lastName,
  username: backendUser.username,
});

class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/api/auth/login', {
      email,
      password,
    });
    return {
      token: response.data.token,
      user: mapUser(response.data.user),
    };
  }

  async register(data: Omit<User, 'id'> & { password: string }): Promise<{ token: string; user: User }> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/api/auth/register', data);
    return {
      token: response.data.token,
      user: mapUser(response.data.user),
    };
  }

  async getMe(): Promise<{ user: User }> {
    const response = await api.get<ApiResponse<CurrentUserResponseData>>('/api/auth/me');
    return {
      user: mapUser(response.data.user),
    };
  }
}

export const authService = new AuthService();
