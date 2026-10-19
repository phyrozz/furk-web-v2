import { Plus, Trash2 } from 'lucide-react';
import { formatTime, timeValue, type BreakDraft, type BreakHour, type BusinessHour } from './hours';

interface TimeFieldProps {
  label: string;
  accessibleLabel: string;
  value: string | null;
  onChange: (value: string) => void;
  errorId?: string;
}

const TimeField = ({ label, accessibleLabel, value, onChange, errorId }: TimeFieldProps) => (
  <label className="min-w-0 text-xs font-medium text-gray-500">
    {label}
    <input
      type="time"
      step={60}
      value={timeValue(value)}
      onChange={(event) => onChange(event.target.value)}
      aria-label={accessibleLabel}
      aria-invalid={Boolean(errorId)}
      aria-describedby={errorId}
      className="furk-field mt-1 min-w-0 !px-2.5 text-sm aria-[invalid=true]:border-red-400"
    />
  </label>
);

interface BusinessDayProps {
  day: string;
  hours: BusinessHour;
  error?: string;
  onChange: (field: 'open_time' | 'close_time', value: string) => void;
  onToggle: () => void;
}

export const BusinessDay = ({ day, hours, error, onChange, onToggle }: BusinessDayProps) => {
  const isOpen = Boolean(hours.open_time || hours.close_time);
  const errorId = error ? `day-error-${hours.day_of_week}` : undefined;
  return (
    <div className={`grid grid-cols-2 items-center gap-3 p-4 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] sm:gap-4 sm:px-6 ${!isOpen ? 'bg-gray-50/60' : ''}`}>
      <div>
        <h3 className="text-sm font-bold text-gray-800">{day}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{isOpen ? 'Open for bookings' : 'Closed'}</p>
      </div>
      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        {isOpen ? (
          <div className="grid grid-cols-2 gap-3">
            <TimeField label="Opens at" accessibleLabel={`${day} opening time`} value={hours.open_time} onChange={(value) => onChange('open_time', value)} errorId={errorId} />
            <TimeField label="Closes at" accessibleLabel={`${day} closing time`} value={hours.close_time} onChange={(value) => onChange('close_time', value)} errorId={errorId} />
          </div>
        ) : <p className="hidden text-sm text-gray-400 sm:block">Taking the day off</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOpen}
        aria-label={`${day} open for bookings`}
        onClick={onToggle}
        className="col-start-2 row-start-1 flex min-h-11 items-center justify-end gap-2 rounded-lg text-xs font-semibold text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-3"
      >
        <span>{isOpen ? 'Open' : 'Closed'}</span>
        <span className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${isOpen ? 'bg-primary-600' : 'bg-gray-300'}`} aria-hidden="true">
          <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isOpen ? 'translate-x-4' : ''}`} />
        </span>
      </button>
      {error && <p id={errorId} className="col-span-full text-xs text-red-600">{error}</p>}
    </div>
  );
};

interface BreakDayProps {
  day: string;
  hours: BusinessHour;
  breaks: BreakDraft[];
  errors: Record<string, string>;
  onAdd: () => void;
  onChange: (key: string, changes: Partial<BreakHour>) => void;
  onRemove: (key: string) => void;
}

export const BreakDay = ({ day, hours, breaks, errors, onAdd, onChange, onRemove }: BreakDayProps) => {
  const isOpen = Boolean(hours.open_time && hours.close_time);
  return (
    <div className={`p-4 sm:px-6 ${!isOpen ? 'bg-gray-50/60' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{day}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{isOpen ? `${formatTime(hours.open_time)} – ${formatTime(hours.close_time)}` : 'Closed · set business hours to add breaks'}</p>
        </div>
        <button type="button" disabled={!isOpen} onClick={onAdd} aria-label={`Add break on ${day}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-primary-200 bg-white px-3 text-xs font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-40">
          <Plus size={15} aria-hidden="true" /> Add break
        </button>
      </div>
      {breaks.length === 0 ? (
        <p className="mt-2 text-xs text-gray-400">{isOpen ? 'No breaks scheduled. Add one when you need a little pause.' : 'No breaks scheduled.'}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {breaks.map((entry, index) => {
            const errorId = errors[entry.key] ? `break-error-${entry.key}` : undefined;
            return (
              <fieldset key={entry.key} className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <legend className="sr-only">{day} break {index + 1}</legend>
                <div className="grid grid-cols-2 items-end gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto]">
                  <TimeField label="Starts at" accessibleLabel={`${day} break ${index + 1} start time`} value={entry.break_start} onChange={(value) => onChange(entry.key, { break_start: value || null })} errorId={errorId} />
                  <TimeField label="Ends at" accessibleLabel={`${day} break ${index + 1} end time`} value={entry.break_end} onChange={(value) => onChange(entry.key, { break_end: value || null })} errorId={errorId} />
                  <label className="min-w-0 text-xs font-medium text-gray-500">
                    Label <span className="font-normal">(optional)</span>
                    <input type="text" value={entry.label || ''} onChange={(event) => onChange(entry.key, { label: event.target.value })} aria-label={`${day} break ${index + 1} label`} placeholder="e.g. Lunch break" className="furk-field mt-1 text-sm" />
                  </label>
                  <button type="button" onClick={() => onRemove(entry.key)} aria-label={`Remove ${day} break ${index + 1}`} className="flex h-11 w-11 items-center justify-center justify-self-end rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500">
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
                {errors[entry.key] && <p id={errorId} className="mt-2 text-xs text-red-600">{errors[entry.key]}</p>}
              </fieldset>
            );
          })}
        </div>
      )}
    </div>
  );
};
