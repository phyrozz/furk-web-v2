import { useState } from 'react';
import { Mail, Lock, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';
import { loginService } from '../../../services/login/login-service';

interface LoginFormProps {
  userType: 'user' | 'merchant' | 'admin';
  onSuccessfulLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ userType, onSuccessfulLogin }) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    await loginService.resetPassword({
      email: loginMethod === 'email' ? email : undefined,
      phone: loginMethod === 'phone' ? phone : undefined,
      password: password,
    }, newPassword);

    setShowResetPassword(false);
    setError('');
    // Attempt login with new password
    handleSubmit(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginService.login({
        email: loginMethod === 'email' ? email : undefined,
        phone: loginMethod === 'phone' ? phone : undefined,
        password: showResetPassword ? newPassword : password
      });

      console.log('Login response:', response);

      if (response.message === 'New password required') {
        setShowResetPassword(true);
        setIsLoading(false);
        return;
      }

      if (response.data?.role) {
        userType = response.data.role;
        if (userType === 'merchant') {
          navigate('/merchant/dashboard');
        } else if (userType === 'user') {
          onSuccessfulLogin();
        } else {
          // TODO: future handling for admin login
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={showResetPassword ? handlePasswordReset : handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {showResetPassword 
          ? 'Reset Your Password'
          : userType === 'user' 
            ? 'Sign in to your Pet Owner account' 
            : 'Sign in to your Service Provider account'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              loginMethod === 'email'
                ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              loginMethod === 'phone'
                ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Phone
          </button>
        </div>

        {loginMethod === 'email' ? (
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
                required={loginMethod === 'email'}
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Phone size={18} />
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+1 (555) 000-0000"
                required={loginMethod === 'phone'}
              />
            </div>
          </div>
        )}

        {showResetPassword ? (
          <>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </>
        ) : (
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        )}

        {!showResetPassword && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </a>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading 
            ? (showResetPassword ? 'Resetting Password...' : 'Signing in...') 
            : (showResetPassword ? 'Reset Password' : 'Sign In')}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;