import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

export const Login = () => {
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
      const { token, user } = await authService.login(email, password);
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
      <div className="glass-panel rounded-xl p-xl flex flex-col gap-lg w-full max-w-[460px] justify-between">
          <div className="text-center mb-md">
            <h1 className="font-headline-lg text-headline-lg text-on-background mb-xs">Welcome back</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Log in to your BeaverIDE workspace.</p>
          </div>

          {/* Email Form */}
          <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded bg-error-container p-sm">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-background" htmlFor="email">Email Address</label>
              <input 
                className="bg-surface-container-lowest border border-outline-variant rounded px-sm py-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-all placeholder-on-surface-variant/50 text-on-surface" 
                id="email" 
                name="email" 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" 
              />
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-background" htmlFor="password">Password</label>
                <a className="font-label-md text-label-md text-tertiary hover:underline cursor-pointer" href="#">Forgot Password?</a>
              </div>
              <input 
                className="bg-surface-container-lowest border border-outline-variant rounded px-sm py-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-all text-on-surface" 
                id="password" 
                name="password" 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
              />
            </div>
            <button 
              className="w-full bg-primary-container text-on-primary py-sm px-md rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary transition-colors font-label-md text-label-md mt-sm cursor-pointer" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
  );
};
