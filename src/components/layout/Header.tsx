import { Link, useLocation } from 'react-router-dom';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';
import { Code2 } from 'lucide-react';

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  const isEditor = location.pathname.startsWith('/room/');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md',
        isEditor && 'bg-surface border-outline-variant/50'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white group-hover:bg-primary-container transition-colors">
              <Code2 size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-on-surface">
              Beaver<span className="text-primary">IDE</span>
            </span>
          </Link>

          {!isEditor && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Home</Link>
              <Link to="/about" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Contact</Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {!isEditor && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant/30">
                <span className="text-sm font-medium text-on-surface">{user?.firstName}</span>
                <Button variant="ghost" size="sm" onClick={logout} className="text-error hover:text-error hover:bg-error-container/50">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
