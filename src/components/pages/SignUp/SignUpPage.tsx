import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignUpForm from './SignUpForm';
import { useGuideTooltip } from '../../../providers/GuideTooltip';

interface SignUpPageProps {
  userType: 'user' | 'merchant';
}

const SignUpPage: React.FC<SignUpPageProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { email, password } = location.state || {};
  const referralCode = searchParams.get('ref');
  const { tooltipState, setTooltipState } = useGuideTooltip();

  const handleSuccessfulSignUp = () => {
    if (userType === 'merchant') {
      navigate('/merchant/dashboard');
      return;
    }
    
    if (userType === 'user') {
      setTooltipState({ ...tooltipState, isNewUser: true });
    }
    navigate('/services');
  };

  const getBannerContent = () => {
    if (userType === 'merchant') {
      return {
        title: 'FURK Merchant Program',
        subtitle: 'Join our platform and grow your pet service business',
        features: [
          {
            title: 'Reach More Customers',
            description: 'Connect with pet owners looking for your services'
          },
          {
            title: 'Easy Management',
            description: 'Manage bookings, services, and customers all in one place'
          },
          {
            title: 'Secure Payments',
            description: 'Get paid quickly and securely through our platform'
          }
        ]
      };
    } else {
      return {
        title: 'FURK Pet Services',
        subtitle: 'Find trusted pet care services for your furry friends',
        features: [
          {
            title: 'Trusted Providers',
            description: 'Connect with verified pet service professionals'
          },
          {
            title: 'Easy Booking',
            description: 'Book services quickly and manage appointments online'
          },
          {
            title: 'Peace of Mind',
            description: 'Get quality care for your pets with our secure platform'
          }
        ]
      };
    }
  };

  const bannerContent = getBannerContent();

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
          <span className="text-4xl font-cursive font-bold mb-4">{bannerContent.title}</span>
          <p className="text-xl mb-8">{bannerContent.subtitle}</p>
          <div className="space-y-4">
            {bannerContent.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4 bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="text-left">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm opacity-80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Column - Sign Up Form */}
      <div className="w-full md:w-1/2 p-6 bg-gray-50 flex justify-center overflow-y-auto max-h-screen">
        <div className="w-full max-w-md">
          <SignUpForm 
            userType={userType} 
            onSuccessfulSignUp={handleSuccessfulSignUp} 
            redirectToVerification={{ email, password }}
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
                navigate('/login');
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

export default SignUpPage;