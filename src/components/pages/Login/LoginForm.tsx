import { useState } from 'react';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';
import { refreshAuthTokens } from 'aws-amplify/auth/cognito';

interface LoginFormProps {
  userType: 'user' | 'merchant' | 'admin';
  onSuccessfulLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ userType, onSuccessfulLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (await loginService.isAuthenticated()) {
        const currentUser = await loginService.getCurrentUser();

        if (currentUser) {
          await refreshAuthTokens(currentUser);
          return;
        }
      }

      const response = await loginService.login({
        userType: userType,
        email: email,
        password: password
      });

      if (response.message === 'New password required') {
        setIsLoading(false);
        return;
      }

      if (response.message === 'User is not confirmed') {
        if (userType === 'user') {
          navigate('/sign-up/user', { state: { email, password } });
        } else {
          navigate('/sign-up/merchant', { state: { email, password } });
        }
        return;
      }

      if (response.data?.role) {
        onSuccessfulLogin();
      } else {
        localStorage.clear();
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/reset-password', { state: { userType } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-cursive font-bold text-gray-800 mb-6">
        {userType === 'user' 
          ? 'Sign in to your Pet Owner account' 
          : 'Sign in to your Merchant account'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="your@email.com"
              required={true}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div> */}
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        >
          {isLoading 
            ? 'Signing in...'
            : 'Sign In'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;