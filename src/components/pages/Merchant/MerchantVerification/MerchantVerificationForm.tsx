import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Check, Clock3, FileCheck2, FileText, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../common/Button';
import Input from '../../../common/Input';
import MerchantNavbar from '../../../common/MerchantNavbar';
import MultipleAutocomplete from '../../../common/MultipleAutocomplete';
import Autocomplete from '../../../common/Autocomplete';
import LocationPicker from '../../../common/LocationPicker';
import PawLoading from '../../../common/PawLoading';
import { S3UploadService } from '../../../../services/s3-upload/s3-upload-service';
import { MerchantVerificationService } from '../../../../services/merchant-verification/merchant-verification-service';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import { LocationService } from '../../../../services/location/location-service';
import { ToastService } from '../../../../services/toast/toast-service';
import { businessMerchantRequirements, freelanceMerchantRequirements } from './types';
import type { ServiceGroup, UploadRequirement } from './types';
import VerificationUploadCard from './VerificationUploadCard';
import { getVerificationIssues, validateVerificationFile } from './verification-form';
import type { ProviderType, VerificationDraft, VerificationUploads } from './verification-form';
import styles from './MerchantVerificationForm.module.css';

const dataService = new MerchantVerificationService();
const locationService = new LocationService();
const profileService = new MerchantProfileService();
const limit = 20;
const uploadGroups = [
  { type: 'document', title: 'Documents & identification', description: 'Help us verify your identity and professional background.' },
  { type: 'photo', title: 'Photos & bank details', description: 'Share clear photos and the account details needed for payouts.' },
  { type: 'video', title: 'Your services in action', description: 'Show your actual pet service. Each video should be no longer than 1 minute.' },
] as const;

const AddressSelect = ({ id, label, options, value, onChange, disabled = false }: {
  id: string; label: string; options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean;
}) => {
  const [query, setQuery] = useState('');
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-gray-700">{label} <span className="text-error-600">*</span></label>
      <Autocomplete id={id} options={options.filter(option => option.toLowerCase().includes(query.toLowerCase())).map(value => ({ value }))} value={value ? { value } : null} onChange={option => { setQuery(''); onChange(option?.value ?? ''); }} getOptionLabel={option => option.value} onSearch={async query => { setQuery(query); }} placeholder={`Select ${label.toLowerCase()}`} disabled={disabled} />
    </div>
  );
};

const MerchantVerificationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isForReapplying = Boolean((location.state as { isForReapplying?: boolean } | null)?.isForReapplying);
  const [merchantType, setMerchantType] = useState<ProviderType>('BUSINESS');
  const [draft, setDraft] = useState<VerificationDraft>({ businessName: '', province: '', city: '', barangay: '', address: '', lat: 14.5995, long: 120.9842 });
  const [uploadsByType, setUploadsByType] = useState<Record<ProviderType, VerificationUploads>>({ BUSINESS: {}, FREELANCE: {} });
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [selectedServiceGroups, setSelectedServiceGroups] = useState<ServiceGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  const [profileLoading, setProfileLoading] = useState(isForReapplying);
  const [profileError, setProfileError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const previewUrls = useRef(new Set<string>());
  const groupRequest = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const provinces = useMemo(() => locationService.getProvinces(), []);
  const cities = useMemo(() => draft.province ? locationService.getCities(draft.province) : [], [draft.province]);
  const barangays = useMemo(() => draft.province && draft.city ? locationService.getBarangays(draft.province, draft.city) : [], [draft.province, draft.city]);
  const isBusiness = merchantType === 'BUSINESS';
  const requirements = isBusiness ? businessMerchantRequirements : freelanceMerchantRequirements;
  const uploads = uploadsByType[merchantType];
  const requiredFiles = requirements.filter(requirement => requirement.required);
  const readyFiles = requiredFiles.filter(requirement => uploads[requirement.id]?.status === 'success').length;
  const filesToUpload = requirements.filter(requirement => uploads[requirement.id]?.status === 'success');
  const issues = getVerificationIssues(draft, selectedServiceGroups, requirements, uploads);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  useEffect(() => {
    if (!isForReapplying) return;
    let active = true;
    setProfileLoading(true);
    setProfileError(false);
    void profileService.getMerchantDetails().then(({ data }) => {
      if (!active) return;
      if (!data?.business_name) throw new Error('Profile unavailable');
      setDraft({ businessName: data.business_name, province: data.province ?? '', city: data.city ?? '', barangay: data.barangay ?? '', address: data.address ?? '', lat: data.latitude ?? 14.5995, long: data.longitude ?? 120.9842 });
      setMerchantType(data.merchant_type === 'FREELANCE' ? 'FREELANCE' : 'BUSINESS');
    }).catch(() => { if (active) setProfileError(true); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [isForReapplying, profileAttempt]);

  const releasePreview = (url?: string) => {
    if (url) { URL.revokeObjectURL(url); previewUrls.current.delete(url); }
  };

  const handleFileChange = (requirement: UploadRequirement, file: File) => {
    const error = validateVerificationFile(requirement, file);
    releasePreview(uploads[requirement.id]?.preview);
    const preview = !error && (file.type.startsWith('image/') || requirement.type === 'photo' || requirement.type === 'video') ? URL.createObjectURL(file) : undefined;
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setShowErrors(true);
    setSubmitError('');
    if (issues.length) {
      requestAnimationFrame(() => { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      return;
    }
    setIsSubmitting(true);
    setUploadedCount(0);
    try {
      const response: { data: { application_id: number } } = await dataService.submitMerchantApplicationDetails({ ...draft, businessName: draft.businessName.trim(), merchantType, serviceGroups: selectedServiceGroups });
      const s3Service = new S3UploadService();
      const uploadResults = await Promise.allSettled(filesToUpload.map(async requirement => {
        const file = uploads[requirement.id]!.file;
        const key = `merchant-verification/${response.data.application_id}/${requirement.id}/${s3Service.generateUniqueFileName(file.name)}`;
        await s3Service.uploadFile(file, key);
        setUploadedCount(count => count + 1);
      }));
      if (uploadResults.some(result => result.status === 'rejected')) throw new Error('Some files could not be uploaded');
      localStorage.setItem('merchantStatus', 'pending');
      ToastService.show('Your verification has been submitted. You can now review your files and track your status.');
      navigate('/merchant/verification');
    } catch (error) {
      const apiError = isAxiosError<{ error?: string; message?: string }>(error) ? error.response?.data : undefined;
      setSubmitError(apiError?.error || apiError?.message || 'Your application could not be submitted completely. Your selected files are still here. Please try again.');
      requestAnimationFrame(() => { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0 lg:pl-[var(--merchant-navbar-width,18rem)]">
      <MerchantNavbar />
      <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link to="/merchant/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-700"><ArrowLeft size={16} aria-hidden="true" /> Back to dashboard</Link>
        <header className="furk-panel mb-6 overflow-hidden">
          <div className={styles.hero}>
            <div className={styles.intro}>
              <span className="hidden rounded-2xl bg-primary-100 p-3 text-primary-700 sm:block"><ShieldCheck size={28} aria-hidden="true" /></span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-primary-900 sm:text-3xl">{isForReapplying ? 'Update your verification' : 'Verify your merchant account'}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-700">Tell us about the care you offer and share your supporting documents. We'll help you get ready to connect with pet owners.</p>
              </div>
            </div>
            <p className={styles.reviewTime}><Clock3 size={16} aria-hidden="true" /> Typical review: 2 to 3 business days</p>
          </div>
          <nav aria-label="Verification sections" className={styles.steps}>
            <a href="#provider-details"><span>1</span> Your details</a>
            <a href="#provider-location"><span>2</span> Location</a>
            <a href="#verification-uploads"><span>3</span> Documents & files</a>
          </nav>
        </header>

        {profileLoading ? <div role="status" className="flex min-h-64 items-center justify-center"><PawLoading /><span className="sr-only">Loading your application details</span></div> : profileError ? (
          <div role="alert" className="furk-panel p-6"><p className="mb-4 text-sm text-error-800">We could not load your existing details. Please try again before resubmitting.</p><Button onClick={() => setProfileAttempt(attempt => attempt + 1)}>Try again</Button></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <fieldset disabled={isSubmitting} className={`min-w-0 ${isSubmitting ? 'pointer-events-none' : ''}`}>
              <legend className="sr-only">Merchant verification application</legend>
              <div className={styles.layout}>
              <div className="min-w-0 space-y-6">
                {(submitError || (showErrors && issues.length > 0)) && (
                  <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-2xl border border-error-200 bg-error-50 p-5 text-sm text-error-800">
                    <p className="font-bold">{submitError || 'A few things still need your attention'}</p>
                    {!submitError && <ul className="mt-2 list-inside list-disc space-y-1">{issues.map(issue => <li key={issue.id}><a href={`#${issue.id}`} className="underline underline-offset-2">{issue.message}</a></li>)}</ul>}
                  </div>
                )}

                <section id="provider-details" aria-labelledby="details-title" className="furk-panel scroll-mt-24 p-5 sm:p-6">
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
                    <div><label htmlFor="serviceGroups" className="mb-2 block text-sm font-bold text-gray-700">Services you offer <span className="text-error-600">*</span></label><MultipleAutocomplete id="serviceGroups" options={serviceGroups} values={selectedServiceGroups} onChange={setSelectedServiceGroups} getOptionLabel={option => option.name} getOptionValue={option => option.id} placeholder="Search service types" onSearch={searchServiceGroups} onLoadMore={searchServiceGroups} hasMore={hasMoreGroups} isLoading={isLoadingGroups} maxSelections={5} /><p className="mt-2 text-xs text-gray-500">Choose up to 5 service types.</p></div>
                  </div>
                </section>

                <section id="provider-location" aria-labelledby="location-title" className="furk-panel scroll-mt-24 p-5 sm:p-6">
                  <p className="furk-eyebrow">Step 2</p>
                  <h2 id="location-title" className="text-xl font-bold text-gray-900">{isBusiness ? 'Where is your business based?' : 'Where are you based?'}</h2>
                  <p className="mt-2 text-sm text-gray-600">{isBusiness ? 'Add your business address and check its location on the map.' : 'Add your current address and check your location on the map.'}</p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AddressSelect id="province" label="Province" options={provinces} value={draft.province} onChange={province => setDraft(previous => ({ ...previous, province, city: '', barangay: '' }))} />
                    <AddressSelect id="city" label="City or municipality" options={cities} value={draft.city} onChange={city => setDraft(previous => ({ ...previous, city, barangay: '' }))} disabled={!draft.province} />
                    <AddressSelect id="barangay" label="Barangay" options={barangays} value={draft.barangay} onChange={barangay => setDraft(previous => ({ ...previous, barangay }))} disabled={!draft.city} />
                    <Input id="address" label="Street address" value={draft.address} onChange={event => setDraft(previous => ({ ...previous, address: event.target.value }))} maxLength={512} placeholder="Unit, building, street" wrapperClassName="mb-0" required />
                  </div>
                  <div className="mt-6">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700"><MapPin size={16} aria-hidden="true" /> {isBusiness ? 'Business location' : 'Your location'}</p>
                    <p className="mb-3 text-xs text-gray-500">Search for a place, drag the pin, or click the map to set your location.</p>
                    <LocationPicker initialLat={draft.lat} initialLng={draft.long} readonly={isSubmitting} enableSearch searchLocations={async query => { const response = await dataService.searchLocations(query, 6); return response.data || []; }} onChange={(lat, long) => setDraft(previous => ({ ...previous, lat, long }))} />
                  </div>
                </section>

                <section id="verification-uploads" aria-labelledby="uploads-title" className="furk-panel scroll-mt-24 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="furk-eyebrow">Step 3</p><h2 id="uploads-title" className="text-xl font-bold text-gray-900">Your verification files</h2></div>
                    <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700" aria-live="polite">{readyFiles} of {requiredFiles.length} required files ready</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Choose clear, readable files. Your files will upload when you submit the application.</p>
                  <div className="mt-6 space-y-7">
                    {uploadGroups.map(group => (
                      <div key={group.type}>
                        <h3 className="text-sm font-bold text-gray-900">{group.title}</h3><p className="mt-1 text-xs text-gray-500">{group.description}</p>
                        <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
                          {requirements.filter(requirement => requirement.type === group.type).map(requirement => <VerificationUploadCard key={`${merchantType}-${requirement.id}`} requirement={requirement} upload={uploads[requirement.id]} disabled={isSubmitting} onFileChange={handleFileChange} onRemove={removeFile} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={styles.sidebar}>
                <div className={`furk-panel ${styles.summaryCard}`}>
                  <div className={styles.summaryHeading}><FileCheck2 size={20} aria-hidden="true" /><h2 className="text-base font-bold text-gray-900">Your application</h2></div>
                  <p className="mt-2 text-sm text-gray-600">{isBusiness ? 'Business or company' : 'Freelancer or individual'}</p>
                  <div className={styles.progressRow}><p className="text-2xl font-extrabold text-primary-800">{Math.round(readyFiles / requiredFiles.length * 100)}%</p><span className="text-xs text-gray-500">Required files prepared</span></div>
                  <div role="progressbar" aria-label="Required verification files prepared" aria-valuenow={readyFiles} aria-valuemin={0} aria-valuemax={requiredFiles.length} className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${readyFiles / requiredFiles.length * 100}%` }} /></div>
                  <ul className={styles.checklist}>
                    {[{ label: 'Provider details', ready: Boolean(draft.businessName.trim() && selectedServiceGroups.length) }, { label: 'Address details', ready: Boolean(draft.province && draft.city && draft.barangay && draft.address.trim()) }, { label: `${readyFiles} of ${requiredFiles.length} required files`, ready: readyFiles === requiredFiles.length }].map(item => <li key={item.label}><span className={`${styles.statusDot} ${item.ready ? styles.statusReady : ''}`}>{item.ready && <Check size={13} aria-hidden="true" />}</span><span className="text-gray-600">{item.label}</span><span className="sr-only">{item.ready ? 'Complete' : 'Incomplete'}</span></li>)}
                  </ul>
                  <Button type="submit" fullWidth loading={isSubmitting} icon={!isSubmitting ? <ArrowRight size={16} aria-hidden="true" /> : undefined}>{isSubmitting ? 'Submitting application' : 'Submit application'}</Button>
                  {isSubmitting && <p role="status" className="mt-3 text-center text-xs text-primary-700">Uploading files: {uploadedCount} of {filesToUpload.length}. Keep this page open.</p>}
                  <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">After submitting, you can review your files and track your verification status.</p>
                  <button type="button" onClick={clearFiles} disabled={isSubmitting || !Object.values(uploads).some(Boolean)} className="mt-4 w-full rounded-lg py-2 text-xs font-semibold text-gray-500 underline underline-offset-4 hover:text-error-700 disabled:opacity-40">Clear selected files</button>
                </div>
                <div className="mt-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary-800"><FileText size={17} aria-hidden="true" /> Before you submit</div>
                  <p className="mt-3 text-xs leading-relaxed text-primary-700">Make sure names and details match across your documents. Use clear photos with all corners visible.</p>
                  <p className="mt-3 text-xs leading-relaxed text-primary-700">Review usually takes 2 to 3 business days. We'll email you when your status changes.</p>
                  <a href="mailto:support@furk.app" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-700 underline underline-offset-4"><AlertCircle size={14} aria-hidden="true" /> Need help? Contact support</a>
                </div>
              </aside>
              </div>
            </fieldset>
          </form>
        )}
      </main>
    </div>
  );
};

export default MerchantVerificationForm;
