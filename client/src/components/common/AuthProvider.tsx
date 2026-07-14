import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isInitializing, setAuth, logout, setInitializing } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('beaveride_token');
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const { user } = await authService.getMe();
        setAuth(user, token);
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
        logout();
      }
    };

    restoreSession();
  }, [setAuth, logout, setInitializing]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Spinner with Tailwind styling */}
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-label-md text-label-md text-on-surface-variant animate-pulse">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
