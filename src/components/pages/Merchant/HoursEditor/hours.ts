export interface BusinessHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
}

export interface BreakHour {
  id?: number;
  day_of_week: number;
  break_start: string | null;
  break_end: string | null;
  label?: string;
}

export type BreakDraft = BreakHour & { key: string };

export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const timeValue = (time: string | null | undefined) => time?.slice(0, 5) || '';

export const formatTime = (time: string | null | undefined) => {
  if (!time) return '';
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export const normalizeBusinessHours = (hours: BusinessHour[]) => daysOfWeek.map((_, day) => {
  const current = hours.find((entry) => entry.day_of_week === day);
  return {
    day_of_week: day,
    open_time: timeValue(current?.open_time) || null,
    close_time: timeValue(current?.close_time) || null,
  };
});

export const businessHoursPayload = (hours: BusinessHour[]): BusinessHour[] => hours
  .filter((entry) => entry.open_time && entry.close_time)
  .map((entry) => ({
    day_of_week: entry.day_of_week,
    open_time: `${timeValue(entry.open_time)}:00`,
    close_time: `${timeValue(entry.close_time)}:00`,
  }));

export const breakHoursPayload = (breaks: BreakDraft[]): BreakHour[] => breaks.map((entry) => ({
  day_of_week: entry.day_of_week,
  break_start: timeValue(entry.break_start) || null,
  break_end: timeValue(entry.break_end) || null,
  label: entry.label?.trim() || 'Break',
}));

export const updateBreak = (breaks: BreakDraft[], key: string, changes: Partial<BreakHour>) =>
  breaks.map((entry) => entry.key === key ? { ...entry, ...changes } : entry);

export const validateBusinessHours = (hours: BusinessHour[]) => {
  const errors: Record<number, string> = {};
  for (const entry of hours) {
    if (!entry.open_time && !entry.close_time) continue;
    if (!entry.open_time || !entry.close_time) errors[entry.day_of_week] = 'Choose both an opening and a closing time.';
    else if (timeValue(entry.open_time) >= timeValue(entry.close_time)) errors[entry.day_of_week] = 'Closing time must be later than opening time.';
  }
  return errors;
};

export const validateBreakHours = (breaks: BreakDraft[], hours: BusinessHour[]) => {
  const errors: Record<string, string> = {};
  for (const entry of breaks) {
    const business = hours.find((hour) => hour.day_of_week === entry.day_of_week);
    const start = timeValue(entry.break_start);
    const end = timeValue(entry.break_end);
    if (!start || !end) errors[entry.key] = 'Choose a start and end time for this break.';
    else if (start >= end) errors[entry.key] = 'End time must be later than start time.';
    else if (!business?.open_time || !business.close_time) errors[entry.key] = 'Set business hours for this day before adding a break.';
    else if (start < timeValue(business.open_time) || end > timeValue(business.close_time)) errors[entry.key] = 'Keep this break within the business hours shown above.';
  }
  for (let index = 0; index < breaks.length; index++) {
    const current = breaks[index];
    if (!current.break_start || !current.break_end) continue;
    for (const other of breaks.slice(index + 1)) {
      if (current.day_of_week !== other.day_of_week || !other.break_start || !other.break_end) continue;
      // Match the API, which also treats touching endpoints as overlapping.
      if (timeValue(current.break_start) <= timeValue(other.break_end) && timeValue(other.break_start) <= timeValue(current.break_end)) {
        errors[current.key] ??= 'Breaks must not overlap. Leave a gap between them.';
        errors[other.key] ??= 'Breaks must not overlap. Leave a gap between them.';
      }
    }
  }
  return errors;
};
