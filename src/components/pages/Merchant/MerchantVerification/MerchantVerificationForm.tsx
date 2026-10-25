import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Check, Clock3, FileCheck2, FileText, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../common/Button';
import Input from '../../../common/Input';
import MerchantNavbar from '../../../common/MerchantNavbar';
import MultipleAutocomplete from '../../../common/MultipleAutocomplete';
import AddressSelect from './AddressSelect';
import LocationPicker from '../../../common/LocationPicker';
import PawLoading from '../../../common/PawLoading';
import { MerchantVerificationService } from '../../../../services/merchant-verification/merchant-verification-service';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import { LocationService } from '../../../../services/location/location-service';
import { ToastService } from '../../../../services/toast/toast-service';
import { businessMerchantRequirements, freelanceMerchantRequirements } from './types';
import type { ServiceGroup, UploadRequirement } from './types';
import VerificationUploadCard from './VerificationUploadCard';
import { getVerificationIssues, getVerificationIssueStep, validateVerificationFile } from './verification-form';
import type { ProviderType, VerificationDraft, VerificationUploads, VerificationStep } from './verification-form';
import { draftSignature, persistDraft, restoreDraft } from './verification-draft';
import type { VerificationDraftState } from './verification-draft';
import styles from './MerchantVerificationForm.module.css';

const dataService = new MerchantVerificationService();
const locationService = new LocationService();
const profileService = new MerchantProfileService();
const limit = 20;
const mobileVerificationQuery = '(max-width: 1023px)';
const verificationSteps = ['Your details', 'Location', 'Documents & review'];
const initialDraftState: VerificationDraftState = {
  draft: { businessName: '', province: '', city: '', barangay: '', address: '', lat: 14.5995, long: 120.9842 },
  merchantType: 'BUSINESS', serviceGroups: [], uploadsByType: { BUSINESS: {}, FREELANCE: {} },
  pinPlaced: false, pinConfirmed: false, currentStep: 1,
};
const uploadGroups = [
  { type: 'document', title: 'Documents & identification', description: 'Help us verify your identity and professional background.' },
  { type: 'photo', title: 'Photos & bank details', description: 'Share clear photos and the account details needed for payouts.' },
  { type: 'video', title: 'Your services in action', description: 'Show your actual pet service. Each video should be no longer than 1 minute.' },
] as const;

const MerchantVerificationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isForReapplying = Boolean((location.state as { isForReapplying?: boolean } | null)?.isForReapplying);
  const [merchantType, setMerchantType] = useState<ProviderType>('BUSINESS');
  const [draft, setDraft] = useState<VerificationDraft>(initialDraftState.draft);
  const [uploadsByType, setUploadsByType] = useState<Record<ProviderType, VerificationUploads>>({ BUSINESS: {}, FREELANCE: {} });
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [selectedServiceGroups, setSelectedServiceGroups] = useState<ServiceGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [savedSignature, setSavedSignature] = useState(() => draftSignature(initialDraftState));
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pinPlaced, setPinPlaced] = useState(false);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(mobileVerificationQuery).matches);
  const [currentStep, setCurrentStep] = useState<VerificationStep>(1);
  const previewUrls = useRef(new Set<string>());
  const groupRequest = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLElement>(null);
  const pendingStepFocus = useRef(false);
  const provinces = useMemo(() => locationService.getProvinces(), []);
  const cities = useMemo(() => draft.province ? locationService.getCities(draft.province) : [], [draft.province]);
  const barangays = useMemo(() => draft.province && draft.city ? locationService.getBarangays(draft.province, draft.city) : [], [draft.province, draft.city]);
  const isBusiness = merchantType === 'BUSINESS';
  const requirements = isBusiness ? businessMerchantRequirements : freelanceMerchantRequirements;
  const uploads = uploadsByType[merchantType];
  const requiredFiles = requirements.filter(requirement => requirement.required);
  const readyFiles = requiredFiles.filter(requirement => uploads[requirement.id]?.status === 'success').length;
  const isBusy = isSubmitting || isSaving;
  const formState: VerificationDraftState = { draft, merchantType, serviceGroups: selectedServiceGroups, uploadsByType, pinPlaced, pinConfirmed, currentStep };
  const hasUnsavedChanges = draftSignature(formState) !== savedSignature;
  const saveStatus = isBusy
    ? uploadedCount < uploadTotal ? `Uploading files: ${uploadedCount} of ${uploadTotal}` : isSubmitting ? 'Submitting application...' : 'Saving draft...'
    : hasUnsavedChanges ? 'Unsaved changes' : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}` : 'Not saved yet';
  const issues = getVerificationIssues(draft, selectedServiceGroups, requirements, uploads);
  if (!pinConfirmed) issues.push({ id: 'confirm-location', message: 'Check the map and confirm your exact location.' });
  const visibleIssues = isMobile ? issues.filter(issue => getVerificationIssueStep(issue.id) === currentStep) : issues;
  const fullAddress = [draft.address.trim(), draft.barangay, draft.city, draft.province].filter(Boolean).join(', ');
  const addressComplete = Boolean(draft.address.trim() && draft.barangay && draft.city && draft.province);
  const updateAddress = (fields: Partial<VerificationDraft>) => {
    setDraft(previous => ({ ...previous, ...fields }));
    setPinConfirmed(false);
  };

  useEffect(() => {
    const media = window.matchMedia(mobileVerificationQuery);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMobile || !pendingStepFocus.current) return;
    pendingStepFocus.current = false;
    activeStepRef.current?.focus({ preventScroll: true });
    activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep, isMobile]);

  const goToStep = (step: VerificationStep) => {
    if (isBusy) return;
    pendingStepFocus.current = true;
    setCurrentStep(step);
    setShowErrors(false);
    setSubmitError('');
  };

  const focusErrors = () => {
    requestAnimationFrame(() => { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  };

  const nextStep = () => {
    if (isBusy || currentStep === 3) return;
    setSubmitError('');
    if (visibleIssues.length) {
      setShowErrors(true);
      focusErrors();
      return;
    }
    goToStep((currentStep + 1) as VerificationStep);
  };

  useEffect(() => {
    const urls = previewUrls.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError(false);
    const load = async () => {
      const [draftResponse, applicationResponse] = await Promise.all([dataService.getDraft(), dataService.getOwnApplication()]);
      if (!active) return;
      const application = applicationResponse.data;
      if (application && ['pending', 'verified', 'suspended'].includes(application.status)) {
        navigate('/merchant/verification', { replace: true });
        return;
      }
      let restored = initialDraftState;
      if (draftResponse.data) {
        restored = restoreDraft(draftResponse.data);
        setDraftVersion(draftResponse.data.version);
        setLastSavedAt(draftResponse.data.modified_at);
      } else if (isForReapplying || application?.status === 'rejected') {
        const { data } = await profileService.getMerchantDetails();
        if (!active) return;
        if (!data?.business_name) throw new Error('Profile unavailable');
        restored = {
          ...initialDraftState,
          draft: { businessName: data.business_name, province: data.province ?? '', city: data.city ?? '', barangay: data.barangay ?? '', address: data.address ?? '', lat: data.latitude ?? 14.5995, long: data.longitude ?? 120.9842 },
          pinPlaced: Number.isFinite(data.latitude) && Number.isFinite(data.longitude),
          merchantType: data.merchant_type === 'FREELANCE' ? 'FREELANCE' : 'BUSINESS',
          serviceGroups: (application?.business_types ?? []).map(group => ({ ...group, id: String(group.id), description: '' })),
        };
      }
      setDraft(restored.draft);
      setMerchantType(restored.merchantType);
      setSelectedServiceGroups(restored.serviceGroups);
      setUploadsByType(restored.uploadsByType);
      setPinPlaced(restored.pinPlaced);
      setPinConfirmed(restored.pinConfirmed);
      setCurrentStep(restored.currentStep);
      setSavedSignature(draftSignature(restored));
    };
    void load().catch(() => { if (active) setProfileError(true); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [isForReapplying, profileAttempt, navigate]);

  useEffect(() => {
    if (!hasUnsavedChanges && !isBusy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [hasUnsavedChanges, isBusy]);

  const releasePreview = (url?: string) => {
    if (url && previewUrls.current.has(url)) { URL.revokeObjectURL(url); previewUrls.current.delete(url); }
  };

  const handleFileChange = (requirement: UploadRequirement, file: File) => {
    const error = validateVerificationFile(requirement, file);
    releasePreview(uploads[requirement.id]?.preview);
    const preview = !error && ((requirement.type === 'photo' && file.type.startsWith('image/')) || (requirement.type === 'video' && file.type.startsWith('video/'))) ? URL.createObjectURL(file) : undefined;
    if (preview) previewUrls.current.add(preview);
    setUploadsByType(previous => ({ ...previous, [merchantType]: { ...previous[merchantType], [requirement.id]: { id: requirement.id, file, preview, status: error ? 'error' : 'success', error } } }));
  };

  const removeFile = (id: string) => {
    releasePreview(uploads[id]?.preview);
    setUploadsByType(previous => ({ ...previous, [merchantType]: { ...previous[merchantType], [id]: null } }));
  };

  const clearFiles = () => {
    Object.values(uploads).forEach(upload => releasePreview(upload?.preview));
    setUploadsByType(previous => ({ ...previous, [merchantType]: {} }));
  };

  const searchServiceGroups = async (keyword: string, offset = 0) => {
    const requestId = ++groupRequest.current;
    setIsLoadingGroups(true);
    try {
      const response: { data: ServiceGroup[] } = await dataService.listServiceGroups(limit, offset, keyword);
      if (requestId !== groupRequest.current) return;
      setServiceGroups(previous => offset ? [...previous, ...response.data] : response.data);
      setHasMoreGroups(response.data.length === limit);
    } catch {
      if (requestId === groupRequest.current) ToastService.show('Could not load service types. Please search again.');
    } finally {
      if (requestId === groupRequest.current) setIsLoadingGroups(false);
    }
  };

  const saveProgress = async () => {
    const saved = await persistDraft(dataService, formState, draftVersion, setUploadsByType, (completed, total) => {
      setUploadedCount(completed);
      setUploadTotal(total);
    });
    setDraftVersion(saved.version);
    setLastSavedAt(saved.modified_at);
    setSavedSignature(saved.signature);
    return saved;
  };

  const handleSaveDraft = async () => {
    if (isBusy) return;
    setIsSaving(true);
    setSubmitError('');
    try {
      const saved = await saveProgress();
      if (saved.unsavedFiles) {
        setSubmitError(`Your details and uploaded files were saved, but ${saved.unsavedFiles} selected ${saved.unsavedFiles === 1 ? 'file could' : 'files could'} not be saved. Check the file formats and try saving again before leaving.`);
        focusErrors();
        return;
      }
      ToastService.show('Draft saved. You can return later to finish your verification.');
      navigate('/merchant/verification');
    } catch (error) {
      const apiError = isAxiosError<{ error?: string; message?: string }>(error) ? error.response?.data : undefined;
      setSubmitError(apiError?.error || apiError?.message || 'Your draft could not be saved. Please keep this page open and try again.');
      focusErrors();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) return;
    if (isMobile && currentStep < 3) { nextStep(); return; }
    setShowErrors(true);
    setSubmitError('');
    if (issues.length) {
      if (isMobile) setCurrentStep(Math.min(...issues.map(issue => getVerificationIssueStep(issue.id))) as VerificationStep);
      focusErrors();
      return;
    }
    setIsSubmitting(true);
    setUploadedCount(0);
    try {
      const saved = await saveProgress();
      if (saved.unsavedActiveFiles) throw new Error('Some files could not be uploaded');
      await dataService.submitMerchantApplicationDetails(saved.version);
      localStorage.setItem('merchantStatus', 'pending');
      ToastService.show('Your verification has been submitted. You can now review your files and track your status.');
      navigate('/merchant/verification');
    } catch (error) {
      // The server may have committed while the final response was interrupted.
      try {
        const { data } = await dataService.getOwnApplication();
        if (data?.status === 'pending') {
          localStorage.setItem('merchantStatus', 'pending');
          navigate('/merchant/verification');
          return;
        }
      } catch { /* Keep the form available for another attempt. */ }
      const apiError = isAxiosError<{ error?: string; message?: string }>(error) ? error.response?.data : undefined;
      setSubmitError(apiError?.error || apiError?.message || 'Your application could not be submitted completely. Please retry before leaving. Files already uploaded will not need to be uploaded again.');
      requestAnimationFrame(() => { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 lg:pt-0 lg:pl-[var(--merchant-navbar-width,18rem)] ${styles.page}`}>
      <MerchantNavbar />
      <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link to="/merchant/dashboard" onClick={event => { if (isBusy || (hasUnsavedChanges && !window.confirm('Leave without saving your latest changes? Choose Save & finish later to keep your progress.'))) event.preventDefault(); }} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-700"><ArrowLeft size={16} aria-hidden="true" /> Back to dashboard</Link>
        <header className="furk-panel mb-4 overflow-hidden">
          <div className={styles.hero}>
            <div className={styles.intro}>
              <span className="hidden rounded-2xl bg-primary-100 p-3 text-primary-700 sm:block"><ShieldCheck size={28} aria-hidden="true" /></span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-primary-900 sm:text-3xl">{isForReapplying ? 'Update your verification' : 'Verify your merchant account'}</h1>
                <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-primary-700 sm:block">Tell us about the care you offer and share your supporting documents. We'll help you get ready to connect with pet owners.</p>
              </div>
            </div>
            <p className={styles.reviewTime}><Clock3 size={16} aria-hidden="true" /> Typical review: 2 to 3 business days</p>
          </div>
        </header>
        <nav id="merchant-verification-progress" aria-label={isMobile ? 'Verification progress' : 'Verification sections'} className={`furk-panel mb-6 ${styles.steps}`}>
          {isMobile ? <>
            <p className={styles.stepStatus} role="status">Step {currentStep} of 3: {verificationSteps[currentStep - 1]}</p>
            <ol className={styles.mobileSteps}>
              {verificationSteps.map((label, index) => <li key={label} aria-current={currentStep === index + 1 ? 'step' : undefined} className={currentStep === index + 1 ? styles.currentStep : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}
            </ol>
          </> : <>
          <a href="#provider-details"><span>1</span> Your details</a>
          <a href="#provider-location"><span>2</span> Location</a>
          <a href="#verification-uploads"><span>3</span> Documents</a>
          </>}
        </nav>

        {profileLoading ? <div role="status" className="flex min-h-64 items-center justify-center"><PawLoading /><span className="sr-only">Loading your application details</span></div> : profileError ? (
          <div role="alert" className="furk-panel p-6"><p className="mb-4 text-sm text-error-800">We could not load your saved verification. Please try again before editing so your progress stays safe.</p><Button onClick={() => setProfileAttempt(attempt => attempt + 1)}>Try again</Button></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-busy={isBusy} className={styles.form}>
            <div className={`furk-panel mb-6 p-4 ${styles.draftActions}`}>
              <div><p role="status" className="text-sm font-bold text-primary-800">{saveStatus}</p><p className="mt-1 text-xs text-gray-600">Save your details and chosen files, even if your application is incomplete.</p></div>
              <Button type="button" variant="outline" disabled={isBusy} onClick={handleSaveDraft}>Save &amp; finish later</Button>
            </div>
            <fieldset disabled={isBusy} className={`min-w-0 ${isBusy ? 'pointer-events-none' : ''}`}>
              <legend className="sr-only">Merchant verification application</legend>
              <div className={styles.layout}>
              <div className="min-w-0 space-y-6">
                {(submitError || (showErrors && visibleIssues.length > 0)) && (
                  <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-2xl border border-error-200 bg-error-50 p-5 text-sm text-error-800">
                    <p className="font-bold">{submitError || 'A few things still need your attention'}</p>
                    {!submitError && <ul className="mt-2 list-inside list-disc space-y-1">{visibleIssues.map(issue => <li key={issue.id}><a href={`#${issue.id}`} className="underline underline-offset-2">{issue.message}</a></li>)}</ul>}
                  </div>
                )}

                {(!isMobile || currentStep === 1) && <section ref={isMobile ? activeStepRef : undefined} tabIndex={isMobile ? -1 : undefined} id="provider-details" aria-labelledby="details-title" className={`furk-panel p-5 sm:p-6 ${styles.section}`}>
                  <p className="furk-eyebrow">Step 1</p>
                  <h2 id="details-title" className="text-xl font-bold text-gray-900">A little about you</h2>
                  <p className="mt-2 text-sm text-gray-600">Choose how you provide pet services. We'll show you the requirements that apply.</p>
                  <fieldset className="mt-5">
                    <legend className="mb-3 text-sm font-bold text-gray-700">I am registering as a <span className="text-error-600">*</span></legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([{ value: 'BUSINESS', title: 'Business or company', description: 'A registered business with a team or establishment.', Icon: Building2 }, { value: 'FREELANCE', title: 'Freelancer or individual', description: 'An independent professional offering pet services.', Icon: UserRound }] as const).map(({ value, title, description, Icon }) => (
                        <label key={value} className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 ${merchantType === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                          <input type="radio" name="merchantType" value={value} checked={merchantType === value} onChange={() => { setMerchantType(value); setShowErrors(false); setSubmitError(''); }} className="sr-only" />
                          <Icon size={22} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                          <span className="flex-1 pr-4"><span className="block text-sm font-bold text-gray-900">{title}</span><span className="mt-1 block text-xs leading-relaxed text-gray-600">{description}</span></span>
                          <span className={`absolute right-3 top-4 flex h-4 w-4 items-center justify-center rounded-full border ${merchantType === value ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>{merchantType === value && <Check size={12} aria-hidden="true" />}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <Input id="businessName" label={isBusiness ? 'Business name' : 'Professional or business name'} value={draft.businessName} onChange={event => setDraft(previous => ({ ...previous, businessName: event.target.value }))} maxLength={255} placeholder={isBusiness ? 'Your registered business name' : 'The name you use for your services'} wrapperClassName="mb-0" required disabled={isForReapplying} />
                    <div><label htmlFor="serviceGroups" className="mb-2 block text-sm font-bold text-gray-700">Services you offer <span className="text-error-600">*</span></label><MultipleAutocomplete id="serviceGroups" mobileDropdownTopBoundaryId={isMobile ? 'merchant-verification-progress' : undefined} mobileDropdownBottomBoundaryId={isMobile ? 'merchant-verification-controls' : undefined} options={serviceGroups} values={selectedServiceGroups} onChange={setSelectedServiceGroups} getOptionLabel={option => option.name} getOptionValue={option => option.id} placeholder="Search service types" onSearch={searchServiceGroups} onLoadMore={searchServiceGroups} hasMore={hasMoreGroups} isLoading={isLoadingGroups} maxSelections={5} /><p className="mt-2 text-xs text-gray-500">Choose up to 5 service types.</p></div>
                  </div>
                </section>}

                {(!isMobile || currentStep === 2) && <section ref={isMobile ? activeStepRef : undefined} tabIndex={isMobile ? -1 : undefined} id="provider-location" aria-labelledby="location-title" className={`furk-panel p-5 sm:p-6 ${styles.section}`}>
                  <p className="furk-eyebrow">Step 2</p>
                  <h2 id="location-title" className="text-xl font-bold text-gray-900">{isBusiness ? 'Where is your business based?' : 'Where are you based?'}</h2>
                  <p className="mt-2 text-sm text-gray-600">Enter your address and confirm the pin.</p>
                  <h3 className="mt-6 text-sm font-bold text-gray-900">1. Enter your address</h3>
                  <div className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-3">
                    <AddressSelect id="province" label="Province" options={provinces} value={draft.province} onChange={province => updateAddress({ province, city: '', barangay: '' })} hint="For Metro Manila, choose your NCR area." />
                    <AddressSelect key={draft.province} id="city" label="City or municipality" options={cities} value={draft.city} onChange={city => updateAddress({ city, barangay: '' })} disabled={!draft.province} hint={!draft.province ? 'Choose a province first.' : undefined} />
                    <AddressSelect key={`${draft.province}-${draft.city}`} id="barangay" label="Barangay" options={barangays} value={draft.barangay} onChange={barangay => updateAddress({ barangay })} disabled={!draft.city} hint={!draft.city ? 'Choose a city or municipality first.' : undefined} />
                    <div className="md:col-span-3">
                      <Input id="address" label="Building, house number and street" value={draft.address} onChange={event => updateAddress({ address: event.target.value })} maxLength={512} placeholder="e.g. Unit 2, 123 Rizal Street, Sunrise Village" autoComplete="street-address" aria-describedby="street-address-hint" wrapperClassName="mb-0" required />
                      <p id="street-address-hint" className="mt-2 text-xs text-gray-500">Include your unit, floor or subdivision, if applicable.</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900"><MapPin size={16} aria-hidden="true" /> 2. Pin your exact location</h3>
                    <p className="mb-4 mt-2 text-sm text-gray-600">Use <strong className="font-semibold">Find address on map</strong>, then check the pin marks the entrance.</p>
                    {addressComplete && <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3"><p className="text-xs font-semibold text-gray-500">Address to find</p><p className="mt-1 break-words text-sm text-gray-800">{fullAddress}</p></div>}
                    <LocationPicker initialLat={draft.lat} initialLng={draft.long} readonly={isBusy} showMarker={pinPlaced} mobileInteractionGuard addressQuery={addressComplete ? `${fullAddress}, Philippines` : ''} areaQuery={[draft.barangay, draft.city, draft.province, 'Philippines'].filter(Boolean).join(', ')} enableSearch searchLocations={async query => { const response = await dataService.searchLocations(query, 6); return response.data || []; }} onChange={(lat, long) => { setDraft(previous => ({ ...previous, lat, long })); setPinPlaced(true); setPinConfirmed(false); }} />
                    <div className={`mt-4 rounded-xl border p-4 ${pinConfirmed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <label className="flex items-start gap-3 text-sm font-semibold text-gray-800" htmlFor="confirm-location">
                        <input id="confirm-location" type="checkbox" checked={pinConfirmed} disabled={!pinPlaced || !addressComplete || isSubmitting} onChange={event => setPinConfirmed(event.target.checked)} aria-describedby="confirm-location-hint" className="mt-0.5 h-5 w-5 shrink-0 accent-primary-600" />
                        {isBusiness ? 'The pin marks my business entrance' : 'The pin marks my exact location'}
                      </label>
                      <p id="confirm-location-hint" role="status" className="ml-8 mt-1 text-xs text-gray-600">{pinConfirmed ? 'Location confirmed. Continue with your documents.' : !addressComplete ? 'Complete your address, then confirm the pin.' : pinPlaced ? 'Check the pin. Confirm again if you change the address or location.' : 'Find your address, use your location, or adjust the pin.'}</p>
                    </div>
                  </div>
                </section>}

                {(!isMobile || currentStep === 3) && <section ref={isMobile ? activeStepRef : undefined} tabIndex={isMobile ? -1 : undefined} id="verification-uploads" aria-labelledby="uploads-title" className={`furk-panel p-5 sm:p-6 ${styles.section}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="furk-eyebrow">Step 3</p><h2 id="uploads-title" className="text-xl font-bold text-gray-900">Your verification files</h2></div>
                    <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700" aria-live="polite">{readyFiles} of {requiredFiles.length} required files ready</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Choose clear, readable files. Save &amp; finish later uploads your chosen files so you can return to complete the rest. Keep this page open until saving finishes.</p>
                  <div className="mt-6 space-y-7">
                    {uploadGroups.map(group => (
                      <div key={group.type}>
                        <h3 className="text-sm font-bold text-gray-900">{group.title}</h3><p className="mt-1 text-xs text-gray-500">{group.description}</p>
                        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2">
                          {requirements.filter(requirement => requirement.type === group.type).map(requirement => <VerificationUploadCard key={`${merchantType}-${requirement.id}`} requirement={requirement} upload={uploads[requirement.id]} disabled={isBusy} onFileChange={handleFileChange} onRemove={removeFile} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>}
              </div>

              {(!isMobile || currentStep === 3) && <aside className={styles.sidebar}>
                <div className={`furk-panel ${styles.summaryCard}`}>
                  <div className={styles.summaryHeading}><FileCheck2 size={20} aria-hidden="true" /><h2 className="text-base font-bold text-gray-900">Your application</h2></div>
                  <p className="mt-2 text-sm text-gray-600">{isBusiness ? 'Business or company' : 'Freelancer or individual'}</p>
                  {isMobile && <div className="mt-5 border-t border-gray-200 pt-4 text-sm">
                    <h3 className="font-bold text-gray-900">Review your details</h3>
                    <dl className="mt-3 space-y-4">
                      <div><dt className="text-xs text-gray-500">Business or professional name</dt><dd className="mt-1 break-words font-semibold text-gray-800">{draft.businessName}</dd><dd><button type="button" onClick={() => goToStep(1)} disabled={isSubmitting} className="min-h-11 text-sm font-semibold text-primary-700 underline underline-offset-4">Edit your details</button></dd></div>
                      <div><dt className="text-xs text-gray-500">Address</dt><dd className="mt-1 break-words text-gray-800">{fullAddress}</dd><dd className="mt-1 text-xs text-gray-600">{pinConfirmed ? 'Map pin confirmed' : 'Map pin needs confirmation'}</dd><dd><button type="button" onClick={() => goToStep(2)} disabled={isSubmitting} className="min-h-11 text-sm font-semibold text-primary-700 underline underline-offset-4">Edit location</button></dd></div>
                      <div><dt className="text-xs text-gray-500">Services</dt><dd className="mt-1 break-words text-gray-800">{selectedServiceGroups.map(group => group.name).join(', ')}</dd></div>
                    </dl>
                  </div>}
                  <div className={styles.progressRow}><p className="text-2xl font-extrabold text-primary-800">{Math.round(readyFiles / requiredFiles.length * 100)}%</p><span className="text-xs text-gray-500">Required files prepared</span></div>
                  <div role="progressbar" aria-label="Required verification files prepared" aria-valuenow={readyFiles} aria-valuemin={0} aria-valuemax={requiredFiles.length} className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${readyFiles / requiredFiles.length * 100}%` }} /></div>
                  <ul className={styles.checklist}>
                    {[{ label: 'Provider details', ready: Boolean(draft.businessName.trim() && selectedServiceGroups.length) }, { label: 'Address and map pin', ready: addressComplete && pinConfirmed }, { label: `${readyFiles} of ${requiredFiles.length} required files`, ready: readyFiles === requiredFiles.length }].map(item => <li key={item.label}><span className={`${styles.statusDot} ${item.ready ? styles.statusReady : ''}`}>{item.ready && <Check size={13} aria-hidden="true" />}</span><span className="text-gray-600">{item.label}</span><span className="sr-only">{item.ready ? 'Complete' : 'Incomplete'}</span></li>)}
                  </ul>
                  {!isMobile && <Button type="submit" fullWidth loading={isSubmitting} icon={!isSubmitting ? <ArrowRight size={16} aria-hidden="true" /> : undefined}>{isSubmitting ? 'Submitting application' : 'Submit application'}</Button>}
                  {isBusy && <p role="status" className="mt-3 text-center text-xs text-primary-700">{saveStatus} Keep this page open.</p>}
                  <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">After submitting, you can review your files and track your verification status.</p>
                  <button type="button" onClick={clearFiles} disabled={isSubmitting || !Object.values(uploads).some(Boolean)} className="mt-4 w-full rounded-lg py-2 text-xs font-semibold text-gray-500 underline underline-offset-4 hover:text-error-700 disabled:opacity-40">Clear selected files</button>
                </div>
                <div className="mt-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary-800"><FileText size={17} aria-hidden="true" /> Before you submit</div>
                  <p className="mt-3 text-xs leading-relaxed text-primary-700">Make sure names and details match across your documents. Use clear photos with all corners visible.</p>
                  <p className="mt-3 text-xs leading-relaxed text-primary-700">Review usually takes 2 to 3 business days. We'll email you when your status changes.</p>
                  <a href="mailto:support@furk.app" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-700 underline underline-offset-4"><AlertCircle size={14} aria-hidden="true" /> Need help? Contact support</a>
                </div>
              </aside>}
              </div>
            </fieldset>
            {isMobile && <div id="merchant-verification-controls" className={styles.mobileActions} role="group" aria-label="Verification step controls">
              <div className={styles.mobileDraftSave}>
                <p role="status">{saveStatus}</p>
                <button type="button" disabled={isBusy} onClick={handleSaveDraft} className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-bold text-primary-700 underline underline-offset-4 disabled:opacity-50">Save &amp; finish later</button>
              </div>
              <div className={styles.mobileNavigation}>
              {currentStep > 1 && <Button id="verification-back" type="button" variant="outline" disabled={isBusy} onClick={() => goToStep((currentStep - 1) as VerificationStep)}>Back</Button>}
              {currentStep < 3
                ? <Button key="next" id="verification-next" type="button" fullWidth disabled={isBusy} onClick={nextStep}>Next: {currentStep === 1 ? 'Location' : 'Documents'}</Button>
                : <Button key="submit" id="verification-submit" type="submit" fullWidth disabled={isSaving} loading={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit application'}</Button>}
              </div>
            </div>}
          </form>
        )}
      </main>
    </div>
  );
};

export default MerchantVerificationForm;
