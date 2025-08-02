import { useEffect, useState } from 'react';
import { Mail, Lock, User, Phone, CheckCircle, EyeOff, Eye } from 'lucide-react';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';
import { Checkbox } from '../../common/Checkbox';

interface SignUpFormProps {
  userType: 'user' | 'merchant';
  onSuccessfulSignUp: () => void;
  redirectToVerification?: {
    email: string;
    password: string;
  };
  referralCode?: string | null;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ userType, onSuccessfulSignUp, redirectToVerification = undefined, referralCode = null }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isFormValid = () => {
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== '' &&
      password.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      password === confirmPassword &&
      termsAccepted
    );
  };

  useEffect(() => {
    handleRedirectToVerification();
  }, [redirectToVerification]);

  const handleRedirectToVerification = () => {
    if (redirectToVerification && redirectToVerification.email && redirectToVerification.password) {
      setShowVerification(true);
      setEmail(redirectToVerification.email);
      setPassword(redirectToVerification.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let signUp = await loginService.signUp({
        email: email,
        password: password,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        referralCode: referralCode
      });

      if (!signUp) {
        setError('An error occurred during sign up. Please try again.');
        setIsLoading(false);
        return;
      }
      
      setShowVerification(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const verified = await loginService.verifySignUp(email, verificationCode);

      if (verified) {
        const login = await loginService.login({
          email: email,
          password: password,
          userType: userType
        });

        if (!login) {
          setError('An error occurred during login. Please try again.');
          setIsLoading(false);
          return;
        }

        onSuccessfulSignUp();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <form onSubmit={handleVerification} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Verify your account
        </h2>

        <p className="text-gray-600 mb-4">
          We've sent a verification code to your email address. Please enter it below to complete your registration.
        </p>

        {error && (
          <div className="p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <CheckCircle size={18} />
            </div>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter verification code"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </Button>

        <p className="text-sm text-center text-gray-600">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={() => loginService.resendVerificationCode(email)}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Resend code
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-cursive font-bold text-gray-800 mb-6">
        {userType === 'user' 
          ? 'Create your Pet Owner account' 
          : 'Create your Merchant account'}
      </h2>

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">

        {referralCode && <div>
          <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <User size={18} />
            </div>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Referral Code"
              disabled
              required
            />
          </div>
        </div>}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <User size={18} />
            </div>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="John"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <User size={18} />
            </div>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Doe"
              required
            />
          </div>
        </div>

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
              required
            />
          </div>
        </div>

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
              placeholder="+63 900 000 0000"
              required
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock size={18} />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={termsAccepted}
            onChange={(checked) => setTermsAccepted(checked)}
            label={
              <span className="text-sm text-gray-600">
                I agree to Furk's{' '}
                <a
                  href="/terms-of-service"
                  className="text-primary-600 hover:text-primary-500 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
              </span>
            }
            className="flex items-center space-x-2"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!isFormValid()}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;