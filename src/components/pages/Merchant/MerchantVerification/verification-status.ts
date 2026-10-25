import type { VerificationStatus } from '../../../../services/merchant-verification/merchant-verification-service';

export const verificationStatuses: Record<VerificationStatus, { label: string; description: string; className: string }> = {
  unverified: {
    label: 'Not submitted',
    description: 'Submit your business details and verification documents to get started.',
    className: 'bg-gray-100 text-gray-700',
  },
  pending: {
    label: 'In review',
    description: 'Your application is with our team. Please allow 2 to 3 business days for review. We will email you with an update.',
    className: 'bg-amber-50 text-amber-800',
  },
  verified: {
    label: 'Verified',
    description: 'Your verification has been approved. You can review the details and files you provided below.',
    className: 'bg-success-50 text-success-800',
  },
  rejected: {
    label: 'Needs attention',
    description: 'Your application was not approved. Check the feedback sent to your email, review your files below, and resubmit your verification.',
    className: 'bg-error-50 text-error-800',
  },
  suspended: {
    label: 'Suspended',
    description: 'Your account is suspended. Contact support@furk.app for help with your account.',
    className: 'bg-error-50 text-error-800',
  },
};
