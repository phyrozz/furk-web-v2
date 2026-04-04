import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';
import type { LoginResponse } from '../../../services/auth/auth-service';

interface NewPasswordChallengeFormProps {
  userType: 'user' | 'merchant' | 'admin' | 'affiliate';
  email: string;
  onCancel: () => Promise<void> | void;
  onCompleted: (response: LoginResponse) => Promise<void> | void;
  compact?: boolean;
}

const NewPasswordChallengeForm: React.FC<NewPasswordChallengeFormProps> = ({
  userType,
  email,
  onCancel,
  onCompleted,
  compact = false,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginService.completeNewPassword({
        userType,
        newPassword,
      });

      if (response.message === 'New password required') {
        setError('Please use a different password and try again.');
        return;
      }

      await onCompleted(response);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className="bg-gradient-to-r from-primary-50 via-white to-amber-50 px-6 py-5 border-b border-primary-100">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-700">
              Temporary password
            </p>
            <h2 className="mt-1 text-2xl font-cursive font-bold text-gray-800">
              Create your new password
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              The account at <span className="font-semibold text-gray-800">{email}</span> needs a permanent password before you can continue.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <p>
              Choose a password you can remember, and make sure it is different from the temporary one.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Lock size={18} />
            </div>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition-colors hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Lock size={18} />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition-colors hover:text-gray-700"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={() => {
              void onCancel();
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isLoading}
          >
            {isLoading ? 'Updating...' : 'Set New Password'}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle2 size={14} className="text-primary-500" />
          <span>
            This replaces your temporary password and completes the sign-in.
          </span>
        </div>
      </form>
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-md">
      {content}
    </div>
  );
};

export default NewPasswordChallengeForm;
