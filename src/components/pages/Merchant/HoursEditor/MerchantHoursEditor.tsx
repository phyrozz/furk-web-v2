import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Coffee, Copy, Save } from 'lucide-react';
import { isAxiosError } from 'axios';
import Button from '../../../common/Button';
import MerchantNavbar from '../../../common/MerchantNavbar';
import PawLoading from '../../../common/PawLoading';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import { LocalStorageService } from '../../../../services/local-storage/local-storage-service';
import { ToastService } from '../../../../services/toast/toast-service';
import { BusinessDay, BreakDay } from './HoursDay';
import {
  breakHoursPayload, businessHoursPayload, daysOfWeek, formatTime, normalizeBusinessHours,
  timeValue, updateBreak, validateBreakHours, validateBusinessHours, type BreakDraft, type BreakHour,
} from './hours';

interface MerchantHoursEditorProps {
  mode: 'business' | 'breaks';
}

const MerchantHoursEditor = ({ mode }: MerchantHoursEditorProps) => {
  const isBusiness = mode === 'business';
  const [dataService] = useState(() => new MerchantProfileService());
  const [businessHours, setBusinessHours] = useState(() => normalizeBusinessHours([]));
  const [breaks, setBreaks] = useState<BreakDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState('');
  const nextBreakKey = useRef(0);
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);
    void dataService.getMerchantDetails().then((response) => {
      if (!active) return;
      const hours = normalizeBusinessHours(response?.data?.business_hours || []);
      const loadedBreaks: BreakDraft[] = (response?.data?.break_hours || []).map((entry: BreakHour, index: number) => ({
        ...entry,
        break_start: timeValue(entry.break_start) || null,
        break_end: timeValue(entry.break_end) || null,
        key: `saved-${index}`,
      }));
      setBusinessHours(hours);
      setBreaks(loadedBreaks);
      setSavedSnapshot(JSON.stringify(isBusiness ? hours : loadedBreaks));
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [dataService, isBusiness, reload]);

  const isDirty = JSON.stringify(isBusiness ? businessHours : breaks) !== savedSnapshot;
  const businessErrors = validateBusinessHours(businessHours);
  const breakErrors = validateBreakHours(breaks, businessHours);
  const openDays = businessHours.filter((entry) => entry.open_time && entry.close_time).length;
  const hasErrors = isBusiness ? Object.keys(businessErrors).length > 0 || openDays === 0 : Object.keys(breakErrors).length > 0;
  const title = isBusiness ? 'Business hours' : 'Break hours';

  const handleSave = async () => {
    setShowErrors(true);
    setSaveError('');
    if (hasErrors) {
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setIsSaving(true);
    try {
      if (isBusiness) {
        await dataService.updateMerchantBusinessHours(businessHoursPayload(businessHours));
        new LocalStorageService().setHasBusinessHours(true);
        setSavedSnapshot(JSON.stringify(businessHours));
        setShowErrors(false);
        ToastService.show('Business hours updated successfully!');
      } else {
        await dataService.updateMerchantBreakHours(breakHoursPayload(breaks));
        setSavedSnapshot(JSON.stringify(breaks));
        setShowErrors(false);
        ToastService.show('Break hours updated successfully!');
      }
    } catch (error) {
      const message = isAxiosError(error) && typeof error.response?.data?.error === 'string'
        ? error.response.data.error : `Could not save ${title.toLowerCase()}. Please try again.`;
      setSaveError(message);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 pb-28 pt-20 lg:pl-[var(--merchant-navbar-width,18rem)] lg:pr-6 lg:pt-6">
      <MerchantNavbar />
      <div className="mx-auto max-w-6xl space-y-6 lg:pl-6">
        <header>
          <Link to="/merchant/profile" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600">
            <ArrowLeft size={17} aria-hidden="true" /> Back to profile
          </Link>
          {/* <p className="furk-eyebrow">Manage your availability</p> */}
          <h1 className="font-cursive text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            {isBusiness ? 'Make time for every pet. Set the days and times your business is open for bookings.' : 'A little time to recharge. Add recurring breaks for meals, rest, or time with your team.'}
          </p>
        </header>

        <nav aria-label="Availability settings" className="inline-flex max-w-full gap-1 rounded-2xl border border-gray-200 bg-white p-1.5">
          {(['business', 'breaks'] as const).map((tab) => {
            const Icon = tab === 'business' ? Clock3 : Coffee;
            return (
              <Link key={tab} to={`/merchant/${tab === 'business' ? 'business-hours' : 'break-hours'}`} aria-current={mode === tab ? 'page' : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${mode === tab ? 'bg-primary-100 text-primary-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                <Icon size={17} aria-hidden="true" />{tab === 'business' ? 'Business hours' : 'Break hours'}
              </Link>
            );
          })}
        </nav>

        {isLoading ? <div className="flex h-80 items-center justify-center" role="status" aria-label="Loading your hours"><PawLoading /></div> : loadError ? (
          <div className="furk-panel flex flex-col items-center gap-4 p-8 text-center" role="alert">
            <AlertCircle className="text-primary-600" aria-hidden="true" />
            <p className="text-sm text-gray-600">We couldn’t load your schedule. Please try again before making changes.</p>
            <Button variant="outline" onClick={() => setReload((value) => value + 1)}>Try again</Button>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void handleSave(); }} noValidate>
            <fieldset disabled={isSaving} className="min-w-0 space-y-5">
              {(saveError || (showErrors && hasErrors)) && (
                <div ref={errorRef} tabIndex={-1} role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                  <AlertCircle size={19} className="shrink-0" aria-hidden="true" />
                  <p>{saveError || (isBusiness && openDays === 0 ? 'Set business hours for at least one day before saving.' : 'Check the highlighted times below before saving your schedule.')}</p>
                </div>
              )}
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
                <section aria-label="Weekly schedule" className="furk-panel order-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-5 sm:px-6">
                    <div>
                      <h2 className="flex items-center gap-2 font-bold text-gray-900"><CalendarDays size={18} className="text-primary-600" aria-hidden="true" /> Your weekly schedule</h2>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{isBusiness ? 'Switch on a day, then choose your opening and closing times.' : 'Breaks repeat each week and must fit within your business hours.'}</p>
                    </div>
                    {isBusiness && (
                      <button type="button" disabled={!businessHours[0].open_time || !businessHours[0].close_time || Boolean(businessErrors[0])} onClick={() => setBusinessHours((previous) => previous.map((entry) => entry.day_of_week > 0 && entry.day_of_week < 5 ? { ...entry, open_time: previous[0].open_time, close_time: previous[0].close_time } : entry))} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-40">
                        <Copy size={14} aria-hidden="true" /> Copy Monday to weekdays
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {daysOfWeek.map((day, dayIndex) => isBusiness ? (
                      <BusinessDay
                        key={day} day={day} hours={businessHours[dayIndex]} error={showErrors ? businessErrors[dayIndex] : undefined}
                        onChange={(field, value) => setBusinessHours((previous) => previous.map((entry) => entry.day_of_week === dayIndex ? { ...entry, [field]: value || null } : entry))}
                        onToggle={() => setBusinessHours((previous) => previous.map((entry) => entry.day_of_week === dayIndex ? {
                          ...entry,
                          open_time: entry.open_time || entry.close_time ? null : '09:00',
                          close_time: entry.open_time || entry.close_time ? null : '17:00',
                        } : entry))}
                      />
                    ) : (
                      <BreakDay
                        key={day} day={day} hours={businessHours[dayIndex]} breaks={breaks.filter((entry) => entry.day_of_week === dayIndex)} errors={showErrors ? breakErrors : {}}
                        onAdd={() => {
                          const key = `new-${nextBreakKey.current++}`;
                          setBreaks((previous) => [...previous, { key, day_of_week: dayIndex, break_start: null, break_end: null, label: '' }]);
                        }}
                        onChange={(key, changes) => setBreaks((previous) => updateBreak(previous, key, changes))}
                        onRemove={(key) => setBreaks((previous) => previous.filter((entry) => entry.key !== key))}
                      />
                    ))}
                  </div>
                </section>

                <aside className="order-3 space-y-4 xl:col-start-2 xl:row-span-2 xl:row-start-1">
                  <section className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600">{isBusiness ? <Clock3 size={20} aria-hidden="true" /> : <Coffee size={20} aria-hidden="true" />}</div>
                    <h2 className="font-bold text-gray-900">Your week, at a glance</h2>
                    <p className="mt-1 text-sm text-primary-700">{isBusiness ? `${openDays} ${openDays === 1 ? 'day' : 'days'} open · ${7 - openDays} closed` : `${breaks.length} recurring ${breaks.length === 1 ? 'break' : 'breaks'}`}</p>
                    <dl className="mt-5 space-y-3">
                      {daysOfWeek.map((day, index) => (
                        <div key={day} className="flex items-center justify-between gap-2 text-xs">
                          <dt className="text-gray-500">{day.slice(0, 3)}</dt>
                          <dd className="text-right font-medium text-gray-700">{isBusiness ? (businessHours[index].open_time && businessHours[index].close_time ? `${formatTime(businessHours[index].open_time)} – ${formatTime(businessHours[index].close_time)}` : 'Closed') : `${breaks.filter((entry) => entry.day_of_week === index).length} breaks`}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <section className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="text-sm font-bold text-gray-800">{isBusiness ? 'Room for a little pause' : 'Keep your week in sync'}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{isBusiness ? 'Use break hours for lunch or team downtime. Review your breaks whenever your opening hours change.' : 'Breaks sit inside your opening hours. Need to change when a day starts or ends? Update your business hours first.'}</p>
                    <Link to={`/merchant/${isBusiness ? 'break-hours' : 'business-hours'}`} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary-700 hover:text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600">
                      {isBusiness ? 'Manage break hours' : 'Manage business hours'} <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </section>
                </aside>
                <footer className="order-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:px-6 xl:col-start-1">
                  <p className="flex items-center gap-2 text-xs text-gray-500" role="status">{isDirty ? <><span className="h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" /> You have unsaved changes</> : <><Check size={15} className="text-primary-600" aria-hidden="true" /> No unsaved changes</>}</p>
                  <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                    <Button variant="ghost" onClick={() => navigate('/merchant/profile')} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" loading={isSaving} disabled={!isDirty || isSaving} icon={<Save size={17} aria-hidden="true" />}>Save {isBusiness ? 'hours' : 'breaks'}</Button>
                  </div>
                </footer>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
};

export default MerchantHoursEditor;
