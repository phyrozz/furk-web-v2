import { useNavigate } from 'react-router-dom';
import SignUpForm from './SignUpForm';
import { PawPrint as Paw } from 'lucide-react';

interface SignUpPageProps {
  userType: 'user' | 'merchant';
}

const SignUpPage: React.FC<SignUpPageProps> = ({ userType }) => {
  const navigate = useNavigate();

  const handleSuccessfulSignUp = () => {
    // Navigate to appropriate dashboard based on user type
    if (userType === 'merchant') {
      navigate('/merchant/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Paw size={64} />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUpForm 
            userType={userType} 
            onSuccessfulSignUp={handleSuccessfulSignUp} 
          />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href='/login'
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in to your account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;