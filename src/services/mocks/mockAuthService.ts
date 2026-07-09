import type { User } from '../../types';

class MockAuthService {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'test@example.com' && password === 'password') {
          resolve({
            token: 'mock-jwt-token-123',
            user: {
              id: 'u1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
            },
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  }

  async register(data: Partial<User> & { password: string }): Promise<{ token: string; user: User }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock-jwt-token-456',
          user: {
            id: `u${Date.now()}`,
            email: data.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
          },
        });
      }, 500);
    });
  }
}

export const mockAuthService = new MockAuthService();
