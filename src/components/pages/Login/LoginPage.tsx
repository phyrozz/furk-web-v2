import { useState } from 'react';
import { User, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoginForm from './LoginForm';
import { loginService } from '../../../services/auth/auth-service';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'merchant'>('user');
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
          {/* <div className="flex justify-center mb-6">
            <Paw size={64} />
          </div> */}
          <span className="text-4xl font-cursive font-bold mb-4">Welcome to FURK</span>
          <p className="text-xl mb-8">Your one-stop platform for all pet services in the Philippines</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="bg-white text-primary-500 p-2 rounded-full">
                <User size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Pet Owners</h3>
                <p className="text-sm opacity-80">Book services, earn rewards, and manage your pet's needs</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="bg-white text-primary-500 p-2 rounded-full">
                <Store size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Merchants</h3>
                <p className="text-sm opacity-80">List your services, manage bookings, and grow your business</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Login Forms */}
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
              <img src="logo_new_small.png" alt="Logo" className="h-10" />
            </Link>
          </motion.div>

          <motion.div 
            className="bg-white rounded-xl shadow-md overflow-hidden"
            variants={itemVariants}
          >
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  activeTab === 'user'
                    ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('user')}
              >
                Pet Owner
              </button>
              <button
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  activeTab === 'merchant'
                    ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('merchant')}
              >
                Merchant
              </button>
            </div>

            {/* Login Forms */}
            <div className="p-6">
              <LoginForm 
                userType={activeTab}
                onSuccessfulLogin={() => {
                  if (activeTab === 'user') {
                    if (loginService.getUserRole() === 'admin') {
                      navigate('/admin/dashboard');
                    } else {
                      navigate('/services');
                    }
                  } else if (activeTab === 'merchant') {
                    navigate('/merchant/dashboard');
                  } else if (activeTab === 'admin') {
                    navigate('/admin/dashboard');
                  } else {
                    navigate('/');
                  }
                }} 
              />
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
                navigate(activeTab === 'user' ? '/sign-up/user' : '/sign-up/merchant');
              }}
            >
              Register as {activeTab === 'user' ? 'Pet Owner' : 'Merchant'}
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;