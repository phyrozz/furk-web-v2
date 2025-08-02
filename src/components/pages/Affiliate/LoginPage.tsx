import { useState } from 'react';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';

const AffiliateLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use the login service with affiliate user type
      const response = await loginService.login({
        userType: 'affiliate', // Changed from 'user' to 'affiliate'
        email: email,
        password: password
      });

      if (response.message === 'New password required') {
        setIsLoading(false);
        return;
      }

      if (response.message === 'User is not confirmed') {
        navigate('/affiliate/sign-up', { state: { email, password } });
        return;
      }

      if (response.data?.role) {
        navigate('/affiliate/dashboard'); // This would be the affiliate dashboard
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row cursor-default">
      {/* Left Column - Banner */}
      <div className="hidden md:flex md:w-1/2 bg-primary-500 text-white p-12 items-center justify-center">
        <motion.div
          className="max-w-md text-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-4xl font-cursive font-bold mb-4">FURK Affiliate Program</span>
          <p className="text-xl mb-8">Join our affiliate program and earn rewards by promoting pet services</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="text-left">
                <h3 className="font-semibold">Earn Rewards</h3>
                <p className="text-sm opacity-80">Get commissions for every successful referral</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="text-left">
                <h3 className="font-semibold">Easy Tracking</h3>
                <p className="text-sm opacity-80">Monitor your referrals and earnings in real-time</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex justify-center mb-8"
            variants={itemVariants}
          >
            <Link to="/" className="flex items-center text-primary-500">
              <img src="/logo_new_small.png" alt="Logo" className="h-10" />
            </Link>
          </motion.div>

          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            variants={itemVariants}
          >
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-cursive font-bold text-gray-800 mb-6">
                  Sign in to your Affiliate account
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
                    <button
                      type="button"
                      onClick={() => navigate('/reset-password', { state: { userType: 'affiliate' } })}
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
            </div>
          </motion.div>

          <motion.p 
            className="text-center mt-8 text-gray-600"
            variants={itemVariants}
          >
            Don't have an account?{' '}
            <a 
              href="#" 
              className="text-primary-600 font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/affiliate/sign-up');
              }}
            >
              Join the Affiliate Program
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default AffiliateLoginPage;