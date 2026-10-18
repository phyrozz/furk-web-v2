export interface BookingStatusEvent {
  event: string;
  booking_id?: string | number;
  user_id?: string | number;
  service_id?: string | number;
  service_name?: string;
  booking_status: string;
  modified_at?: string;
}

const BOOKING_STATUS_EVENT_TYPES = new Set([
  'booking_progress',
  'booking_confirmed',
  'booking_started',
  'booking_completed',
  'booking_cancelled',
  'booking_auto_rejected',
]);

/** Accept both object messages and the array envelope used by older API handlers. */
export function parseBookingStatusEvents(payload: unknown): BookingStatusEvent[] {
  const messages = Array.isArray(payload) ? payload : [payload];

  return messages.filter((message): message is BookingStatusEvent => {
    if (typeof message !== 'object' || message === null) return false;

    const candidate = message as Record<string, unknown>;
    return (
      typeof candidate.event === 'string' &&
      BOOKING_STATUS_EVENT_TYPES.has(candidate.event) &&
      typeof candidate.booking_status === 'string'
    );
  });
}
