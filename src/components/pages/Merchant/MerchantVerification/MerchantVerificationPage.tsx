import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MerchantNavbar from '../../../common/MerchantNavbar';
import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/Button';
import PawLoading from '../../../common/PawLoading';
import { MerchantVerificationService } from '../../../../services/merchant-verification/merchant-verification-service';
import type { MerchantVerificationApplication, VerificationAttachment } from '../../../../services/merchant-verification/merchant-verification-service';
import { businessMerchantRequirements, freelanceMerchantRequirements } from './types';
import type { UploadRequirement } from './types';
import { verificationStatuses } from './verification-status';

const service = new MerchantVerificationService();

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
};

const SubmittedFile = ({ requirement, attachment }: { requirement: UploadRequirement; attachment?: VerificationAttachment }) => (
  <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
    {attachment?.media_type === 'image' && (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${requirement.name}`} className="block border-b border-gray-100 bg-gray-50 p-3">
        <img src={attachment.url} alt={requirement.name} loading="lazy" className="h-40 w-full object-contain" />
      </a>
    )}
    {attachment?.media_type === 'video' && (
      <video src={attachment.url} controls preload="none" aria-label={requirement.name} className="h-40 w-full bg-gray-900 object-contain" />
    )}
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-start gap-2">
        <FileText size={18} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{requirement.name}</h3>
          {!requirement.required && <p className="mt-1 text-xs text-gray-500">Optional</p>}
        </div>
      </div>
      <p className="mt-2 flex-1 text-xs text-gray-600">{requirement.description}</p>
      {attachment ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-800"><CheckCircle2 size={14} aria-hidden="true" /> Submitted</span>
          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-sm font-bold text-primary-700 underline underline-offset-4" aria-label={`Open ${requirement.name} in a new tab`}>
            Open file <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      ) : (
        <p className={`mt-4 text-xs font-semibold ${requirement.required ? 'text-amber-800' : 'text-gray-500'}`}>
          {requirement.required ? 'File not found' : 'Not submitted'}
        </p>
      )}
    </div>
  </li>
);

const MerchantVerificationPage = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState<MerchantVerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    service.getOwnApplication(controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setApplication(data);
        localStorage.setItem('merchantStatus', data?.status ?? 'unverified');
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('We could not load your verification. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const status = application?.status ?? 'unverified';
  const statusDetails = verificationStatuses[status];
  const requirements = application?.merchant_type === 'BUSINESS'
    ? businessMerchantRequirements
    : application?.merchant_type === 'FREELANCE' ? freelanceMerchantRequirements : [];
  const attachments = application?.attachments ?? [];
  const hasMissingFiles = requirements.some(requirement => requirement.required && !attachments.some(file => file.requirement_id === requirement.id));
  const StatusIcon = status === 'pending' ? Clock : status === 'verified' ? CheckCircle2 : status === 'rejected' || status === 'suspended' ? AlertCircle : ShieldCheck;

  return (
    <div className="min-h-screen bg-gray-50 mt-16 lg:mt-0 lg:pl-[var(--merchant-navbar-width,18rem)]">
      <MerchantNavbar />
      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 md:px-6 lg:px-8">
        <PageHeader
          eyebrow="Your merchant account"
          title="Your verification"
          description="Track your application and review the details and files you provided."
          actions={<Button variant="outline" disabled={loading} onClick={() => setReloadKey(key => key + 1)} icon={<RefreshCw size={16} aria-hidden="true" />}>Refresh status</Button>}
        />
        {loading ? (
          <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-4"><PawLoading /><p className="text-sm text-gray-600">Loading your verification...</p></div>
        ) : error ? (
          <div role="alert" className="furk-panel p-6">
            <p className="mb-4 text-sm text-error-800">{error}</p>
            <Button variant="outline" onClick={() => setReloadKey(key => key + 1)}>Try again</Button>
          </div>
        ) : (
          <>
            <section aria-labelledby="verification-status-title" className="furk-panel mb-6 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${statusDetails.className}`}><StatusIcon size={24} aria-hidden="true" /></div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Verification status</p>
                    <h2 id="verification-status-title" className="text-xl font-bold text-gray-900">{statusDetails.label}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-600">{statusDetails.description}</p>
                    {application && status !== 'unverified' && <p className="mt-3 text-xs text-gray-500">Application #{application.id} · Last updated {formatDate(application.modified_at)}</p>}
                  </div>
                </div>
                {status === 'unverified' && <Button onClick={() => navigate('/merchant/verify')} className="shrink-0">Start verification</Button>}
                {status === 'rejected' && <Button onClick={() => navigate('/merchant/verify', { state: { isForReapplying: true } })} className="shrink-0">Resubmit verification</Button>}
              </div>
            </section>

            {application && status !== 'unverified' && (
              <>
                <section aria-labelledby="verification-details-title" className="furk-panel mb-6 p-5 sm:p-6">
                  <h2 id="verification-details-title" className="text-lg font-bold text-gray-900">Application details</h2>
                  <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-500">Business or professional name</dt><dd className="mt-1 break-words font-semibold text-gray-900">{application.business_name || 'Not provided'}</dd></div>
                    <div><dt className="text-gray-500">Provider type</dt><dd className="mt-1 font-semibold text-gray-900">{application.merchant_type === 'BUSINESS' ? 'Business' : application.merchant_type === 'FREELANCE' ? 'Freelancer' : 'Not provided'}</dd></div>
                    <div><dt className="text-gray-500">Address</dt><dd className="mt-1 break-words font-semibold text-gray-900">{[application.address, application.barangay, application.city, application.province].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
                    <div><dt className="text-gray-500">Service types</dt><dd className="mt-1 font-semibold text-gray-900">{application.business_types.map(type => type.name).join(', ') || 'Not provided'}</dd></div>
                  </dl>
                </section>

                <section aria-labelledby="verification-files-title">
                  <div className="mb-4">
                    <h2 id="verification-files-title" className="text-lg font-bold text-gray-900">Your submitted files</h2>
                    <p className="mt-1 text-sm text-gray-600">{attachments.length} {attachments.length === 1 ? 'file' : 'files'} available. Open a file to view it in a new tab.</p>
                  </div>
                  {hasMissingFiles && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some required files could not be found. Refresh to check again. If they are still missing, contact support for help.</p>}
                  <ul className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {requirements.map(requirement => <SubmittedFile key={requirement.id} requirement={requirement} attachment={attachments.find(file => file.requirement_id === requirement.id)} />)}
                  </ul>
                </section>
              </>
            )}
            <p className="mt-8 text-sm text-gray-600">Need help with your verification? <a href="mailto:support@furk.app" className="font-semibold text-primary-700 underline underline-offset-4">Contact support</a></p>
          </>
        )}
      </main>
    </div>
  );
};

export default MerchantVerificationPage;
