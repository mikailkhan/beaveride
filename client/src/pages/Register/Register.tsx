import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { mockAuthService } from '../../services/mocks/mockAuthService';
import { Code2 } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { token, user } = await mockAuthService.register({
        ...formData,
        username: formData.email.split('@')[0],
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
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md space-y-8 p-8" glass>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4">
              <Code2 size={28} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Create an account</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-container transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-error-container p-4">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">First name</label>
                  <Input name="firstName" required value={formData.firstName} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Last name</label>
                  <Input name="lastName" required value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email address</label>
                <Input type="email" name="email" required value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
                <Input type="password" name="password" required value={formData.password} onChange={handleChange} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Card>
    </div>
  );
};
