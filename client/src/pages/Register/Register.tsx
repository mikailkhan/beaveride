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
