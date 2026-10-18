export interface BookingRequest {
  request_id: string;
  service_id: number;
  booking_datetime: string;
  pet_ids: number[];
  coupon_codes: string[];
}

export interface BookingResult {
  data: {
    request_id: string;
    booking_id: number;
    application_id: number;
    merchant_id: number;
    added_points: number;
    charged_furkredits: number;
  };
}

type BookingApi = {
  createBooking: (request: BookingRequest) => Promise<BookingResult>;
  getBookingRequest: (requestId: string) => Promise<BookingResult>;
};

export const bookingRequestStorageKey = (username: string, serviceId: number) => (
  `furk:booking-request:${username}:${serviceId}`
);

export function restoreBookingRequest(storage: Pick<Storage, 'getItem'>, key: string): BookingRequest | null {
  const value = storage.getItem(key);
  if (value === null) return null;
  const request: BookingRequest = JSON.parse(value);
  if (!request || typeof request.request_id !== 'string' || typeof request.service_id !== 'number' ||
      typeof request.booking_datetime !== 'string' || !Array.isArray(request.pet_ids) ||
      !Array.isArray(request.coupon_codes)) {
    throw new Error('Unable to restore the saved booking request');
  }
  return request;
}

export function persistBookingRequest(storage: Pick<Storage, 'setItem'>, key: string, request: BookingRequest) {
  // Persist before sending so closing/reloading cannot silently create a new ID.
  storage.setItem(key, JSON.stringify(request));
}

export function confirmedBookingResult(value: unknown, requestId: string): BookingResult {
  const result = value as BookingResult;
  if (!result?.data || result.data.request_id !== requestId ||
      !Number.isSafeInteger(result.data.booking_id) || result.data.booking_id <= 0) {
    throw new Error('The booking result could not be confirmed');
  }
  return result;
}

export async function submitOrRecoverBooking(api: BookingApi, request: BookingRequest): Promise<BookingResult> {
  try {
    return confirmedBookingResult(await api.createBooking(request), request.request_id);
  } catch (error) {
    try {
      return confirmedBookingResult(await api.getBookingRequest(request.request_id), request.request_id);
    } catch {
      // A 404 may mean the original transaction is still in flight. The caller
      // must retain the original ID and payload for any subsequent retry.
      throw error;
    }
  }
}
