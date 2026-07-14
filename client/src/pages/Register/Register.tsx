import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const { token, user } = await authService.register({
        firstName,
        lastName,
        email,
        password,
        username,
      });
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]  p-8 relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <img alt="BeaverIDE Logo" className="h-12 mx-auto mb-6" src={BeaverideLogo} />
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Create your workspace</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Start collaborating with your team today.</p>
        </div>

        {/* Social Auth */}
        <div className="space-y-3 mb-6 relative z-10">
          <button 
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-on-surface hover:bg-on-surface/90 text-surface-container-lowest font-label-md text-label-md py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
            </svg>
            Sign up with GitHub
          </button>
          <button 
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md text-label-md py-2.5 px-4 rounded-lg border border-surface-variant transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="relative flex items-center mb-6 z-10">
          <div className="flex-grow border-t border-surface-variant"></div>
          <span className="flex-shrink-0 mx-4 text-on-surface-variant font-label-md text-label-md text-xs uppercase tracking-wider">or continue with email</span>
          <div className="flex-grow border-t border-surface-variant"></div>
        </div>

        {/* Form */}
        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded bg-error-container p-sm text-center">
              <p className="text-sm text-on-error-container">{error}</p>
            </div>
          )}
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="fullName">Full Name</label>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md" 
              id="fullName" 
              placeholder="Jane Doe" 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="username">Username</label>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md" 
              id="username" 
              placeholder="janedoe" 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="email">Email Address</label>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md" 
              id="email" 
              placeholder="jane@example.com" 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1" htmlFor="password">Password</label>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body-md" 
              id="password" 
              placeholder="••••••••" 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            className="w-full bg-primary-container hover:bg-primary-container/90 text-on-primary font-label-md text-label-md py-2.5 px-4 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors mt-2 cursor-pointer disabled:opacity-60" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-6 text-center font-body-md text-sm text-on-surface-variant relative z-10">
          Already have an account? <Link className="text-primary hover:text-primary-fixed transition-colors font-medium" to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};
