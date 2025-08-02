import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AffiliateSignUpForm from './AffiliateSignUpForm';

interface LocationState {
  email?: string;
  password?: string;
}

const AffiliateSignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState;
  
  const [initialEmail, setInitialEmail] = useState(state?.email || '');
  const [initialPassword, setInitialPassword] = useState(state?.password || '');
  const referralCode = searchParams.get('ref');

  const handleSuccess = () => {
    // Navigate to affiliate dashboard after successful signup
    navigate('/affiliate/dashboard');
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
            <div className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="text-left">
                <h3 className="font-semibold">Quick Payouts</h3>
                <p className="text-sm opacity-80">Receive your earnings directly to your bank account</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Sign Up Form */}
      <div className="w-full md:w-1/2 p-6 bg-gray-50 flex justify-center overflow-y-auto max-h-screen">
        <div className="w-full max-w-md">
          <AffiliateSignUpForm 
            onSuccess={handleSuccess} 
            initialEmail={initialEmail} 
            initialPassword={initialPassword} 
            referralCode={referralCode}
          />
          
          <motion.p 
            className="text-center mt-8 text-gray-600 pb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Already have an account?{' '}
            <a 
              href="#" 
              className="text-primary-600 font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/affiliate/login');
              }}
            >
              Sign in
            </a>
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateSignUpPage;