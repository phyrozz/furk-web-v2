import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Upload, Lock, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { Checkbox } from '../../common/Checkbox';
import { loginService } from '../../../services/auth/auth-service';
import { S3UploadService } from '../../../services/s3-upload/s3-upload-service';
import { http } from '../../../utils/http';

interface AffiliateSignUpFormProps {
  onSuccess: () => void;
  initialEmail?: string;
  initialPassword?: string;
  referralCode?: string | null;
}

const AffiliateSignUpForm = ({ onSuccess, initialEmail = '', initialPassword = '', referralCode = null }: AffiliateSignUpFormProps) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialPassword);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  
  // Bank Account detail upload state
  const [validBankAccountFile, setValidBankAccountFile] = useState<File | null>(null);
  const [validBankAccountPreview, setValidBankAccountPreview] = useState<string | null>(null);
  const [bankAccountError, setBankAccountError] = useState('');
  const [bankAccountSuccess, setBankAccountSuccess] = useState(false);

  // File upload state
  const [validIdFile, setValidIdFile] = useState<File | null>(null);
  const [validIdPreview, setValidIdPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dataPrivacyAccepted, setDataPrivacyAccepted] = useState(false);
  
  const s3Service = new S3UploadService();

  // Generate a random affiliate ID when component mounts
  useEffect(() => {
    generateAffiliateId();
  }, []);

  const generateAffiliateId = () => {
    // Generate a random 8-digit number prefixed with 'AFF-'
    const randomId = Math.floor(10000000 + Math.random() * 90000000);
    setAffiliateId(`AFF-${randomId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      setValidIdFile(null);
      setValidIdPreview(null);
      return;
    }

    // Check file type (only images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadError('Only image or PDF files are allowed');
      setValidIdFile(null);
      setValidIdPreview(null);
      return;
    }

    setValidIdFile(file);
    setUploadError('');
    setUploadSuccess(true);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setValidIdPreview(preview);
    } else {
      setValidIdPreview(null);
    }
  };

  const handleBankAccountFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBankAccountError('File size exceeds 5MB limit');
      setValidBankAccountFile(null);
      setValidBankAccountPreview(null);
      return;
    }

    // Check file type (only images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setBankAccountError('Only image or PDF files are allowed');
      setValidBankAccountFile(null);
      setValidBankAccountPreview(null);
      return;
    }

    setValidBankAccountFile(file);
    setBankAccountError('');
    setBankAccountSuccess(true);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setValidBankAccountPreview(preview);
    } else {
      setValidBankAccountPreview(null);
    }
  };

  const removeFile = (type: 'id' | 'bankAccount') => {
    if (type === 'id') {
      if (validIdPreview) {
        URL.revokeObjectURL(validIdPreview);
      }
      setValidIdFile(null);
      setValidIdPreview(null);
      setUploadSuccess(false);
    } else if (type === 'bankAccount') {
      if (validBankAccountPreview) {
        URL.revokeObjectURL(validBankAccountPreview);
      }
      setValidBankAccountFile(null);
      setValidBankAccountPreview(null);
      setBankAccountSuccess(false);
    }
  };

  const isFormValid = () => {
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      mobile.trim() !== '' &&
      address.trim() !== '' &&
      password.trim() !== '' &&
      password === confirmPassword &&
      validBankAccountFile !== null &&
      validIdFile !== null &&
      acceptTerms &&
      dataPrivacyAccepted
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isFormValid()) {
      setError('Please fill in all required fields and accept the terms of service.');
      setIsLoading(false);
      return;
    }

    try {
      // Valid file names must be appended with unique identifiers
        const uniqueIdFileName = s3Service.generateUniqueFileName(validIdFile!.name);
        const uniqueBankAccountFileName = s3Service.generateUniqueFileName(validBankAccountFile!.name);

        // Upload the files to s3
        const idUploadUrl = await s3Service.generateUploadUrl(`affiliate-verification/${affiliateId}/id/${uniqueIdFileName}`, validIdFile!.type);
        const bankAccountUploadUrl = await s3Service.generateUploadUrl(`affiliate-verification/${affiliateId}/bank-account/${uniqueBankAccountFileName}`, validBankAccountFile!.type);
        await s3Service.uploadToS3ByPresignedUrl(idUploadUrl, validIdFile!);
        await s3Service.uploadToS3ByPresignedUrl(bankAccountUploadUrl, validBankAccountFile!);

      // Sign up the user with Cognito
      const signUpResponse = await loginService.signUp({
        userType: 'affiliate',
        firstName,
        lastName,
        email,
        phone: mobile,
        password,
        referralCode: referralCode || undefined,
      });

      if (signUpResponse.message === 'Sign up successful') {
        // Insert addtl. details that are specific to affiliates
        await http.publicPost('/affiliate-login', {
          user_id: signUpResponse.data.id,
          affiliate_id: affiliateId,
          address: address
        });

        setShowVerification(true);
      } else {
        setError(signUpResponse.message || 'Failed to sign up. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setIsLoading(true);

    try {
      // Verify the user's email
      const verifyResponse = await loginService.verifySignUp(email, verificationCode);

      if (verifyResponse.message === 'Sign up successful') {
        // Log the user in
        const loginResponse = await loginService.login({
          userType: 'affiliate',
          email,
          password,
        });

        if (loginResponse.data) {
          onSuccess();
        } else {
          setVerificationError('Verification successful, but login failed. Please try logging in manually.');
        }
      } else {
        setVerificationError(verifyResponse.message || 'Failed to verify. Please check your code and try again.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setVerificationError('');
    setIsLoading(true);

    try {
      const resendResponse = await loginService.resendVerificationCode(email);

      if (resendResponse.message !== 'Verification code resent') {
        setVerificationError(resendResponse.message || 'Failed to resend code. Please try again.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'An error occurred while resending the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (showVerification) {
    return (
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
            <form onSubmit={handleVerification}>
              <h2 className="text-2xl font-cursive font-bold text-gray-800 mb-2">
                Verify your email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification code to {email}. Please enter it below to complete your registration.
              </p>

              {verificationError && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
                  {verificationError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter verification code"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendVerificationCode}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    disabled={isLoading}
                  >
                    Resend verification code
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
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
            <h2 className="text-2xl font-cursive font-bold text-gray-800 mb-5">
              Join the Affiliate Program
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
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

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
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

              {/* Email */}
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

              {/* Mobile */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Phone size={18} />
                  </div>
                  <input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+63 900 000 0000"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <MapPin size={18} />
                  </div>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123 Main St, City, State, Zip"
                    required
                  />
                </div>
              </div>

              {/* Bank Account Details Upload */}
              <div>
                <label htmlFor="bankAccountFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Bank Account Details (e.g., Bank Statement, Passbook)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  {validBankAccountFile ? (
                    <div className="space-y-2 text-center">
                      {validBankAccountPreview ? (
                        <img src={validBankAccountPreview} alt="Bank Account Preview" className="mx-auto h-32 object-contain" />
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <span className="relative rounded-md font-medium text-primary-600 hover:text-primary-500">
                          {validBankAccountFile.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(validBankAccountFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('bankAccount')}
                        className="text-xs font-medium text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="bankAccountFile"
                          className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="bankAccountFile"
                            name="bankAccountFile"
                            type="file"
                            className="sr-only"
                            accept="image/*,.pdf"
                            onChange={handleBankAccountFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, or PDF up to 5MB</p>
                    </div>
                  )}
                </div>
                {bankAccountError && (
                  <p className="mt-2 text-sm text-red-600">{bankAccountError}</p>
                )}
                {bankAccountSuccess && !bankAccountError && (
                  <p className="mt-2 text-sm text-green-600">File uploaded successfully</p>
                )}
              </div>

              {/* Valid ID Upload */}
              <div>
                <label htmlFor="validId" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Valid ID
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  {validIdFile ? (
                    <div className="space-y-2 text-center">
                      {validIdPreview ? (
                        <img src={validIdPreview} alt="ID Preview" className="mx-auto h-32 object-contain" />
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <span className="relative rounded-md font-medium text-primary-600 hover:text-primary-500">
                          {validIdFile.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(validIdFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('id')}
                        className="text-xs font-medium text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="validId"
                          className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="validId"
                            name="validId"
                            type="file"
                            className="sr-only"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, or PDF up to 5MB</p>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
                {uploadSuccess && !uploadError && (
                  <p className="mt-2 text-sm text-green-600">File uploaded successfully</p>
                )}
              </div>

              {/* Affiliate ID (System Generated) */}
              <div>
                <label htmlFor="affiliateId" className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate ID
                </label>
                <input
                  id="affiliateId"
                  type="text"
                  value={affiliateId}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">This is your unique affiliate identifier</p>
              </div>

              {/* Password */}
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

              {/* Confirm Password */}
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
                {password !== confirmPassword && confirmPassword !== '' && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              {/* Terms of Service */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center h-5">
                  <Checkbox
                    checked={acceptTerms}
                    onChange={() => setAcceptTerms(!acceptTerms)}
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
                <div>
                  <Checkbox
                    checked={dataPrivacyAccepted}
                    onChange={(checked) => setDataPrivacyAccepted(checked)}
                    label={
                      <span className="text-sm text-gray-600">
                        I agree to Furk's{' '}
                        <a
                          href="/terms-of-service#data-privacy"
                          className="text-primary-600 hover:text-primary-500 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Data Privacy
                        </a>
                      </span>
                    }
                    className="flex items-center space-x-2"
                  />
                </div>
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AffiliateSignUpForm;