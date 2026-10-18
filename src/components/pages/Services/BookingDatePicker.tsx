import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';

interface BookingDatePickerProps {
  month: string;
  selectedDate: string;
  today: string;
  lastDate: string;
  availableDates: Set<string>;
  loading: boolean;
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
}

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function BookingDatePicker({
  month,
  selectedDate,
  today,
  lastDate,
  availableDates,
  loading,
  onMonthChange,
  onSelect,
}: BookingDatePickerProps) {
  const start = moment(month);
  const offset = (start.day() + 6) % 7;
  const cells = Array.from(
    { length: Math.ceil((offset + start.daysInMonth()) / 7) * 7 },
    (_, index) => {
      const day = index - offset + 1;
      return day > 0 && day <= start.daysInMonth()
        ? start.clone().date(day).format('YYYY-MM-DD')
        : null;
    }
  );
  const previousMonth = start.clone().subtract(1, 'month').format('YYYY-MM-DD');
  const nextMonth = start.clone().add(1, 'month').format('YYYY-MM-DD');

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4"
      aria-busy={loading}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={previousMonth.slice(0, 7) < today.slice(0, 7)}
          onClick={() => onMonthChange(previousMonth)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-primary-50 disabled:opacity-30"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <p className="font-bold text-gray-900" aria-live="polite">
          {start.format('MMMM YYYY')}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={nextMonth > lastDate}
          onClick={() => onMonthChange(nextMonth)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-primary-50 disabled:opacity-30"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center text-sm">
        <caption className="sr-only">
          Choose an appointment in {start.format('MMMM YYYY')}. Unavailable
          dates are disabled.
        </caption>
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-2 text-xs font-semibold text-gray-600"
              >
                <abbr title={day} className="no-underline">
                  {day.slice(0, 2)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((date, index) => (
                <td key={date || `empty-${index}`} className="p-0">
                  {date && (
                    <button
                      type="button"
                      disabled={loading || !availableDates.has(date)}
                      aria-label={`${moment(date).format('dddd, MMMM D, YYYY')}${date === today ? ', today' : ''}${!availableDates.has(date) ? ', unavailable' : ''}`}
                      aria-pressed={selectedDate === date}
                      onClick={() => onSelect(date)}
                      className={`relative flex min-h-11 w-full items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:text-gray-500 ${selectedDate === date ? 'bg-primary-600 text-white shadow-sm' : availableDates.has(date) ? 'bg-primary-50 text-primary-800 hover:bg-primary-100' : 'text-gray-500'} ${date === today && selectedDate !== date ? 'ring-1 ring-inset ring-primary-400' : ''}`}
                    >
                      {moment(date).date()}
                      {date === today && (
                        <span
                          aria-hidden="true"
                          className={`absolute bottom-1 h-1 w-1 rounded-full ${selectedDate === date ? 'bg-white' : 'bg-primary-600'}`}
                        />
                      )}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded bg-primary-100 ring-1 ring-primary-200"
          />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded bg-white ring-1 ring-primary-400"
          />
          Today
        </span>
        <span>Unavailable dates are disabled</span>
      </div>
    </div>
  );
}
