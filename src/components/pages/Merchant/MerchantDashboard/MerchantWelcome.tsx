import { ArrowRight, Check, ChevronDown, Clock, FileText, PawPrint, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../common/Button';
import { businessMerchantRequirements, freelanceMerchantRequirements } from '../MerchantVerification/types';

interface MerchantWelcomeProps {
  status: 'unverified' | 'pending' | 'verified';
  hasBusinessHours: boolean;
}

const requirementGroups = [
  { title: 'For businesses', requirements: businessMerchantRequirements },
  { title: 'For freelancers', requirements: freelanceMerchantRequirements },
];

const MerchantWelcome = ({ status, hasBusinessHours }: MerchantWelcomeProps) => {
  const navigate = useNavigate();
  const isVerified = status === 'verified';
  const isPending = status === 'pending';
  const completedSteps = Number(isVerified) + Number(hasBusinessHours);

  return (
    <section aria-labelledby="merchant-welcome-title" className="furk-panel mb-8 overflow-hidden">
      <div className="border-b border-primary-200 bg-primary-50 p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-700">
              <PawPrint size={18} aria-hidden="true" />
              Your journey starts here
            </div>
            <h1 id="merchant-welcome-title" className="text-2xl font-extrabold text-primary-900 sm:text-3xl">
              {isVerified ? "You're one step closer." : isPending ? 'Thanks for taking the first step!' : 'Welcome to Furk!'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-primary-700 sm:text-base">
              {isVerified
                ? 'Your account is verified. Set your hours next, then add the pet services you offer.'
                : isPending
                  ? 'Your application is with our team. While we review it, set the hours that work for you.'
                  : "Let's get your business ready to meet more pet owners. Start with verification, then set the hours that work for you."}
            </p>
          </div>
          <div className="shrink-0 sm:w-44">
            <p className="text-sm font-semibold text-primary-800">{completedSteps} of 2 setup steps complete</p>
            <div
              role="progressbar"
              aria-label="Merchant setup"
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={completedSteps}
              className="mt-3 h-2 overflow-hidden rounded-full bg-primary-200"
            >
              <div className="h-full rounded-full bg-primary-600" style={{ width: `${completedSteps * 50}%` }} />
            </div>
          </div>
        </div>
      </div>

      <ol className="grid gap-4 p-5 sm:p-8 lg:grid-cols-2">
        <li className={`flex flex-col rounded-2xl border p-5 ${status === 'unverified' ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isVerified ? 'bg-success-50 text-success-800' : isPending ? 'bg-amber-50 text-amber-800' : 'bg-primary-100 text-primary-800'}`}>
              {isVerified ? 'Complete' : isPending ? 'In review' : 'Start here'}
            </span>
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">1. Verify your account</h2>
          <p className="mt-2 flex-1 text-sm text-gray-600">
            {isVerified
              ? "You're verified and ready for the next step."
              : isPending
                ? 'Thanks for sending your documents! Your application is in review. Please allow 2–3 business days.'
                : 'Tell us about your business or freelance work and upload your documents so we can review your application.'}
          </p>
          <div className="mt-5">
            {status === 'unverified' ? (
              <Button id="btn-complete-verification" onClick={() => navigate('/merchant/verify')} className="w-full sm:w-auto">
                Start verification <ArrowRight size={16} className="ml-2" aria-hidden="true" />
              </Button>
            ) : (
              <div>
                <p className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isVerified ? 'text-success-800' : 'text-amber-800'}`}>
                  {isVerified ? <Check size={18} aria-hidden="true" /> : <Clock size={18} aria-hidden="true" />}
                  {isVerified ? 'Account verified' : 'Application submitted'}
                </p>
                <Button variant="outline" onClick={() => navigate('/merchant/verification')}>View submission</Button>
              </div>
            )}
          </div>
        </li>

        <li className="flex flex-col rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Clock size={22} aria-hidden="true" />
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasBusinessHours ? 'bg-success-50 text-success-800' : 'bg-gray-100 text-gray-600'}`}>
              {hasBusinessHours ? 'Complete' : status === 'unverified' ? 'Up next' : 'Ready to set up'}
            </span>
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">2. Set your available hours</h2>
          <p className="mt-2 flex-1 text-sm text-gray-600">
            {hasBusinessHours
              ? 'Your schedule is set. You can update it anytime from Business hours.'
              : 'Choose the days and times you offer services so pet owners know when they can book with you.'}
          </p>
          <div className="mt-5">
            {hasBusinessHours ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-success-800">
                <Check size={18} aria-hidden="true" /> Hours added
              </p>
            ) : (
              <>
                <Button
                  id="btn-set-business-hours"
                  variant="outline"
                  disabled={status === 'unverified'}
                  onClick={() => navigate('/merchant/business-hours')}
                  className="w-full sm:w-auto"
                >
                  Set available hours
                </Button>
                {status === 'unverified' && <p className="mt-2 text-xs text-gray-600">Submit your verification application to unlock this step.</p>}
              </>
            )}
          </div>
        </li>
      </ol>

      {status === 'unverified' && (
        <div className="mx-5 mb-6 rounded-xl border border-gray-200 sm:mx-8 sm:mb-8">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-4 text-sm font-bold text-gray-800 [&::-webkit-details-marker]:hidden">
              <FileText size={18} className="shrink-0 text-primary-600" aria-hidden="true" />
              What do I need for verification?
              <ChevronDown size={18} className="ml-auto shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-gray-200 p-4 sm:p-5">
              <p className="mb-5 text-sm text-gray-600">Prepare the documents for your provider type. You'll choose business or freelancer when you start verification.</p>
              <div className="grid gap-6 md:grid-cols-2">
                {requirementGroups.map(({ title, requirements }) => (
                  <div key={title}>
                    <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
                    <ul className="space-y-3">
                      {requirements.map(requirement => (
                        <li key={requirement.id} className="text-sm">
                          <p className="font-semibold text-gray-700">
                            {requirement.name}
                            {!requirement.required && <span className="ml-1 font-normal text-gray-600">(optional)</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">{requirement.description}</p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            {requirement.acceptedFormats.map(format => format.slice(1).toUpperCase()).join(', ')} · Up to {requirement.maxSize} MB
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm sm:flex-row sm:items-center sm:px-8">
        <p className="text-gray-600"><span className="font-semibold text-gray-800">Coming up:</span> Add your services, pricing, and photos.</p>
        <a href="mailto:support@furk.app" className="shrink-0 font-semibold text-primary-700 underline underline-offset-4">Need a hand? Contact us</a>
      </div>
    </section>
  );
};

export default MerchantWelcome;
