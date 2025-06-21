import { useNavigate } from 'react-router-dom';
import SignUpForm from './SignUpForm';

interface SignUpPageProps {
  userType: 'user' | 'merchant';
}

const SignUpPage: React.FC<SignUpPageProps> = ({ userType }) => {
  const navigate = useNavigate();

  const handleSuccessfulSignUp = () => {
    if (userType === 'merchant') {
      navigate('/merchant/dashboard');
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center sm:py-12 py-0 sm:px-6 lg:px-8 cursor-default">
      <div className="sm:mt-8 mt-0 sm:mx-auto sm:w-full sm:max-w-md">
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
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in to your account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;