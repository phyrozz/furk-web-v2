import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
} from 'react';
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  PawPrint,
  Search,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import moment from 'moment';
import { isAxiosError } from 'axios';
import Button from '../../common/Button';
import BookingDatePicker from './BookingDatePicker';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { loginService } from '../../../services/auth/auth-service';
import { http } from '../../../utils/http';
import {
  bookingRequestStorageKey,
  confirmedBookingResult,
  persistBookingRequest,
  restoreBookingRequest,
  submitOrRecoverBooking,
} from '../../../utils/booking-request';
import type {
  BookingRequest,
  BookingResult,
} from '../../../utils/booking-request';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: number;
  serviceName: string;
  merchantName: string;
  requiresPet: boolean;
  bookingAmount: string;
  merchantId: number;
}

interface Pet {
  id: number;
  name: string;
}
interface Coupon {
  code: string;
  amount: number;
}
interface CouponResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: { code: string; discount_type: string; discount_value: number };
}

const formatCredits = (value: number) =>
  value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatTime = (time: string) => moment(time, 'HH:mm:ss').format('h:mm A');

export default function BookingDialog({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  serviceName,
  merchantName,
  requiresPet,
  bookingAmount,
  merchantId,
}: BookingDialogProps) {
  const id = useId();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BookingRequest | null>(
    null
  );
  const [requestStorageKey, setRequestStorageKey] = useState<string | null>(
    null
  );
  const [requestReady, setRequestReady] = useState(false);
  const submissionInFlight = useRef(false);
  const [couponApplyLoading, setCouponApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [availableSlots, setAvailableSlots] = useState<
    Record<string, string[]>
  >({});
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [calendarMonth, setCalendarMonth] = useState(() =>
    moment().utcOffset(8).startOf('month').format('YYYY-MM-DD')
  );
  const [pets, setPets] = useState<Pet[]>([]);
  const [petPage, setPetPage] = useState(0);
  const [petRefresh, setPetRefresh] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petError, setPetError] = useState<string | null>(null);
  const [hasMorePets, setHasMorePets] = useState(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const petServicesService = useMemo(() => new PetServicesService(), []);
  const amount = Number(bookingAmount) || 0;
  const petCount = requiresPet ? Math.max(selectedPets.length, 1) : 1;
  const bookingTotal = amount * petCount;
  const total = Math.max(
    0,
    bookingTotal + coupons.reduce((sum, coupon) => sum + coupon.amount, 0)
  );
  const today = moment(now).utcOffset(8).format('YYYY-MM-DD');
  const lastDate = moment(now)
    .utcOffset(8)
    .add(6, 'months')
    .format('YYYY-MM-DD');
  const selectedDayTimes = useMemo(
    () =>
      (availableSlots[selectedDate] || []).filter(
        (time) => new Date(`${selectedDate}T${time}+08:00`).getTime() > now
      ),
    [availableSlots, selectedDate, now]
  );
  const availableDates = useMemo(
    () =>
      new Set(
        Object.keys(availableSlots).filter(
          (date) =>
            date >= today &&
            date <= lastDate &&
            availableSlots[date].some(
              (time) => new Date(`${date}T${time}+08:00`).getTime() > now
            )
        )
      ),
    [availableSlots, today, lastDate, now]
  );
  const visiblePets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const isFormValid =
    requestReady &&
    !showSuccess &&
    !!selectedDate &&
    selectedDayTimes.includes(selectedTime) &&
    !availabilityLoading &&
    !availabilityError &&
    (!requiresPet || selectedPets.length > 0);
  const missingSelection = !requestReady
    ? 'Preparing your booking…'
    : !selectedDate
      ? 'Choose a date to get started.'
      : !selectedTime
        ? 'Choose an available time to continue.'
        : requiresPet && !selectedPets.length
          ? 'Select at least one pet to continue.'
          : 'Review your details, then confirm your booking.';

  const completeBooking = useCallback(
    (result: BookingResult, storageKey: string, requestId: string) => {
      confirmedBookingResult(result, requestId);
      // A local cleanup or callback failure must not turn a committed booking into
      // a failed submission. An uncleared record is safe to reconcile on reopening.
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(error);
      }
      setPendingRequest(null);
      setError(null);
      setEarnedPoints(result.data.added_points || 0);
      setShowSuccess(true);
      try {
        onSuccessRef.current();
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setRequestReady(false);
    const restore = async () => {
      try {
        const username = await loginService.getUsernameFromToken();
        if (!username) throw new Error('Please sign in before booking.');
        const key = bookingRequestStorageKey(username, serviceId);
        const request = restoreBookingRequest(localStorage, key);
        if (!active) return;
        setRequestStorageKey(key);
        setPendingRequest(request);
        setRequestReady(true);
        if (request) {
          submissionInFlight.current = true;
          setLoading(true);
          try {
            const result = await petServicesService.getBookingRequest(
              request.request_id
            );
            if (active) completeBooking(result, key, request.request_id);
          } catch {
            if (active)
              setError(
                'Your previous booking result is not confirmed yet. Check its status or retry the same booking request.'
              );
          } finally {
            submissionInFlight.current = false;
            if (active) setLoading(false);
          }
        }
      } catch (error) {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to restore your booking request. Please check booking history.'
          );
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, [isOpen, serviceId, petServicesService, completeBooking]);

  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (selectedTime && !selectedDayTimes.includes(selectedTime))
      setSelectedTime('');
  }, [selectedTime, selectedDayTimes]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPets([]);
      setError(null);
      setSearchQuery('');
      setCouponCode('');
      setCouponError(null);
      setCoupons([]);
      setShowSuccess(false);
      setPetPage(0);
      setPets([]);
      setPendingRequest(null);
      setCalendarMonth(
        moment().utcOffset(8).startOf('month').format('YYYY-MM-DD')
      );
    }
  }, [isOpen]);

  useEffect(() => {
    setCoupons([]);
    setCouponCode('');
    setCouponError(null);
  }, [selectedPets.length]);

  useEffect(() => {
    if (!isOpen || !requiresPet) return;
    let active = true;
    setLoadingPets(true);
    setPetError(null);
    void petServicesService
      .listPets(20, petPage * 20)
      .then((response) => {
        if (!active) return;
        if (!Array.isArray(response.data)) throw new Error('Missing pets');
        const page: Pet[] = response.data;
        setPets((previous) =>
          petPage === 0
            ? page
            : [
                ...previous,
                ...page.filter(
                  (pet) => !previous.some((item) => item.id === pet.id)
                ),
              ]
        );
        setHasMorePets(page.length === 20);
      })
      .catch(() => {
        if (active)
          setPetError('We couldn’t load your pets. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingPets(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, requiresPet, petPage, petRefresh, petServicesService]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailableSlots({});
    void petServicesService
      .listClosuresAndBreaks(
        moment(calendarMonth).toDate(),
        moment(calendarMonth).endOf('month').toDate(),
        merchantId,
        serviceId
      )
      .then((response) => {
        if (!active) return;
        if (!response.data?.available_slots)
          throw new Error('Missing availability');
        setAvailableSlots(response.data.available_slots);
        setDurationMinutes(response.data.duration_minutes);
      })
      .catch(() => {
        if (active)
          setAvailabilityError(
            'We couldn’t load available appointments. Please try again.'
          );
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    isOpen,
    serviceId,
    merchantId,
    calendarMonth,
    availabilityRefresh,
    petServicesService,
  ]);

  useEffect(() => {
    if (showSuccess) successHeadingRef.current?.focus();
    else if (pendingRequest) recoveryHeadingRef.current?.focus();
  }, [showSuccess, pendingRequest]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      submissionInFlight.current ||
      couponApplyLoading ||
      !requestReady ||
      !requestStorageKey ||
      showSuccess
    )
      return;
    submissionInFlight.current = true;
    setError(null);
    setLoading(true);
    let request = pendingRequest;
    let saved = !!request;
    try {
      if (!request) {
        const bookingDateTime = new Date(
          `${selectedDate}T${selectedTime}+08:00`
        );
        if (!isFormValid || bookingDateTime.getTime() <= Date.now()) {
          setError(
            'Please select an available future appointment and any required pets.'
          );
          setAvailabilityRefresh((value) => value + 1);
          return;
        }
        request = {
          request_id: crypto.randomUUID(),
          service_id: serviceId,
          booking_datetime: bookingDateTime.toISOString(),
          pet_ids: requiresPet ? selectedPets.map((pet) => pet.id) : [],
          coupon_codes: coupons.map((coupon) => coupon.code),
        };
        persistBookingRequest(localStorage, requestStorageKey, request);
        saved = true;
        setPendingRequest(request);
      }
      const response = await submitOrRecoverBooking(
        petServicesService,
        request
      );
      completeBooking(response, requestStorageKey, request.request_id);
    } catch (error) {
      const details = isAxiosError<{
        error?: string;
        booking_request_status?: string;
      }>(error)
        ? error.response?.data
        : undefined;
      if (details?.booking_request_status === 'not_created') {
        try {
          localStorage.removeItem(requestStorageKey);
          setPendingRequest(null);
        } catch (error) {
          console.error(error);
        }
        setAvailabilityRefresh((value) => value + 1);
      }
      setError(
        details?.error ||
          (saved
            ? 'The booking result is not confirmed yet. Check its status or retry the same request.'
            : 'Unable to save this booking request. Please check booking history before trying again.')
      );
    } finally {
      submissionInFlight.current = false;
      setLoading(false);
    }
  };

  const checkBookingStatus = async () => {
    if (!pendingRequest || !requestStorageKey || submissionInFlight.current)
      return;
    submissionInFlight.current = true;
    setLoading(true);
    try {
      completeBooking(
        await petServicesService.getBookingRequest(pendingRequest.request_id),
        requestStorageKey,
        pendingRequest.request_id
      );
    } catch {
      setError(
        'No completed result is available yet. You can retry this same booking request.'
      );
    } finally {
      submissionInFlight.current = false;
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code || couponApplyLoading) return;
    setCouponError(null);
    if (
      coupons.some((coupon) => coupon.code.toLowerCase() === code.toLowerCase())
    ) {
      setCouponError('This coupon has already been applied.');
      return;
    }
    if (total <= 0) {
      setCouponError('Your total is already zero.');
      return;
    }
    setCouponApplyLoading(true);
    try {
      const response = await http.post<CouponResponse>(
        '/booking/validate-coupon',
        { code }
      );
      if (
        response.success === false ||
        !response.data ||
        response.message === 'Coupon code is invalid'
      )
        throw new Error(
          response.error || response.message || 'This coupon is invalid.'
        );
      const coupon = response.data;
      if (
        coupons.some(
          (item) => item.code.toLowerCase() === coupon.code.toLowerCase()
        )
      )
        throw new Error('This coupon has already been applied.');
      const discount =
        coupon.discount_type === 'percent'
          ? bookingTotal * (Number(coupon.discount_value) / 100)
          : Number(coupon.discount_value);
      if (!Number.isFinite(discount) || discount < 0)
        throw new Error('This coupon could not be applied.');
      setCoupons((previous) => [
        ...previous,
        { code: coupon.code, amount: -Math.min(discount, total) },
      ]);
      setCouponCode('');
    } catch (error) {
      setCouponError(
        isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ||
              'We couldn’t apply this coupon. Please try again.'
          : error instanceof Error
            ? error.message
            : 'We couldn’t apply this coupon.'
      );
    } finally {
      setCouponApplyLoading(false);
    }
  };

  const closeDialog = () => {
    if (submissionInFlight.current || couponApplyLoading) return;
    onClose();
    // Refresh the surrounding wallet and booking state after a paid booking,
    // matching the existing success flow.
    if (showSuccess) window.location.reload();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeDialog}
      transition
      className="fixed inset-0 z-[60]"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm transition-opacity duration-200 ease-out data-[closed]:opacity-0 motion-reduce:transition-none"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center sm:p-5">
          <DialogPanel transition className="flex h-dvh w-full flex-col overflow-hidden bg-gray-50 shadow-xl transition duration-200 ease-out data-[closed]:translate-y-2 data-[closed]:opacity-0 motion-reduce:transition-none sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-5xl sm:rounded-3xl sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-[0.98]">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 sm:flex">
                  <PawPrint aria-hidden="true" size={24} />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                    {showSuccess ? 'Booking submitted' : 'Book a little care'}
                  </DialogTitle>
                  <Description className="mt-1 text-sm text-gray-600">
                    {showSuccess
                      ? 'You’re one step closer to a happy pet.'
                      : 'Choose a time. We’ll take it from here.'}
                  </Description>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={loading || couponApplyLoading}
                aria-label="Close booking"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {showSuccess ? (
              <div className="overflow-y-auto p-6 text-center sm:p-12">
                <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success-100 text-success-800">
                  <CheckCircle2 size={40} aria-hidden="true" />
                </span>
                <h3
                  ref={successHeadingRef}
                  tabIndex={-1}
                  className="text-2xl font-extrabold text-gray-900"
                >
                  Your pet’s next visit is on its way.
                </h3>
                <p className="mx-auto mt-3 max-w-md text-gray-600">
                  Your booking for <strong>{serviceName}</strong> has been
                  submitted. We’ll notify you when the merchant confirms it.
                </p>
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-primary-200 bg-primary-50 p-5">
                  <p className="text-sm text-primary-800">You earned</p>
                  <p className="mt-1 text-2xl font-extrabold text-primary-800">
                    {earnedPoints.toLocaleString()} FURKoins
                  </p>
                </div>
                <p className="mt-5 text-sm text-gray-600">
                  You can follow your appointment in your profile’s Booking
                  History.
                </p>
                <Button
                  className="mt-6 w-full sm:w-auto"
                  size="lg"
                  onClick={closeDialog}
                >
                  Done
                </Button>
              </div>
            ) : pendingRequest ? (
              <form
                onSubmit={handleSubmit}
                className="overflow-y-auto p-5 sm:p-10"
              >
                <div className="mx-auto max-w-lg rounded-2xl border border-primary-200 bg-white p-5 sm:p-7">
                  <Clock3
                    size={32}
                    className="mb-4 text-primary-700"
                    aria-hidden="true"
                  />
                  <h3
                    ref={recoveryHeadingRef}
                    tabIndex={-1}
                    className="text-xl font-bold text-gray-900"
                  >
                    {loading
                      ? 'Checking your booking'
                      : 'Let’s confirm your booking status'}
                  </h3>
                  <p role="status" className="mt-3 text-sm text-gray-600">
                    {loading
                      ? 'Please wait while we submit or check your appointment.'
                      : 'Your request is saved. Check its status or safely retry the same booking.'}
                  </p>
                  <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm font-semibold text-gray-800">
                    {moment(pendingRequest.booking_datetime)
                      .utcOffset(8)
                      .format('MMMM D, YYYY [at] h:mm A')}
                    <span className="mt-1 block text-xs font-normal text-gray-600">
                      Philippine Time (UTC+8)
                    </span>
                  </p>
                  {error && (
                    <p role="alert" className="mt-4 text-sm text-error-700">
                      {error}
                    </p>
                  )}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={checkBookingStatus}
                      disabled={loading}
                    >
                      Check status
                    </Button>
                    <Button type="submit" loading={loading} disabled={loading}>
                      Retry same booking
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-7">
                  <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700">
                      <PawPrint size={22} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-gray-900">
                        {serviceName}
                      </p>
                      <p className="mt-0.5 break-words text-sm text-gray-600">
                        {merchantName}
                      </p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-800 sm:flex">
                      <Clock3 size={16} aria-hidden="true" />
                      {durationMinutes} min
                    </span>
                  </div>
                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-7">
                    <fieldset
                      disabled={loading || couponApplyLoading}
                      className="min-w-0 space-y-6"
                    >
                      <legend className="sr-only">Appointment details</legend>
                      <section aria-labelledby={`${id}-appointment`}>
                        <div className="mb-4 flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">
                            1
                          </span>
                          <div>
                            <h3
                              id={`${id}-appointment`}
                              className="text-lg font-bold text-gray-900"
                            >
                              Choose your appointment
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              All times are in Philippine Time (UTC+8).
                            </p>
                          </div>
                        </div>
                        <BookingDatePicker
                          month={calendarMonth}
                          selectedDate={selectedDate}
                          today={today}
                          lastDate={lastDate}
                          availableDates={availableDates}
                          loading={availabilityLoading || !!availabilityError}
                          onMonthChange={(month) => {
                            setCalendarMonth(month);
                            setSelectedDate('');
                            setSelectedTime('');
                          }}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedTime('');
                          }}
                        />
                        {availabilityLoading && (
                          <p
                            role="status"
                            className="mt-3 flex items-center gap-2 text-sm text-gray-600"
                          >
                            <Loader2
                              size={16}
                              className="animate-spin motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                            Finding available appointments…
                          </p>
                        )}
                        {availabilityError && (
                          <div
                            role="alert"
                            className="mt-3 rounded-xl bg-error-50 p-3 text-sm text-error-800"
                          >
                            {availabilityError}
                            <button
                              type="button"
                              onClick={() =>
                                setAvailabilityRefresh((value) => value + 1)
                              }
                              className="mt-2 block min-h-11 font-bold underline"
                            >
                              Try again
                            </button>
                          </div>
                        )}
                        {!availabilityLoading &&
                          !availabilityError &&
                          !availableDates.size && (
                            <p
                              role="status"
                              className="mt-3 rounded-xl bg-white p-4 text-sm text-gray-600"
                            >
                              There are no available dates this month. Try
                              another month.
                            </p>
                          )}
                        <fieldset className="mt-5">
                          <legend className="font-bold text-gray-900">
                            {selectedDate
                              ? `Available times · ${moment(selectedDate).format('ddd, MMM D')}`
                              : 'Choose a time'}
                          </legend>
                          {!selectedDate ? (
                            <p className="mt-2 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                              Select an available date to see appointment times.
                            </p>
                          ) : selectedDayTimes.length === 0 ? (
                            <p
                              role="status"
                              className="mt-2 text-sm text-gray-600"
                            >
                              No times are available for this date. Please
                              choose another date.
                            </p>
                          ) : (
                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {selectedDayTimes.map((time) => (
                                <label
                                  key={time}
                                  className="relative cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`${id}-time`}
                                    value={time}
                                    checked={selectedTime === time}
                                    onChange={() => setSelectedTime(time)}
                                    className="peer sr-only"
                                  />
                                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-1 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-primary-400 peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-600">
                                    {formatTime(time)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selectedDate && (
                            <p className="sr-only" role="status">
                              {selectedDayTimes.length} available times on{' '}
                              {moment(selectedDate).format('MMMM D')}.
                            </p>
                          )}
                        </fieldset>
                      </section>

                      <section
                        aria-labelledby={`${id}-pets`}
                        className="border-t border-gray-200 pt-6"
                      >
                        <div className="mb-4 flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">
                            2
                          </span>
                          <div>
                            <h3
                              id={`${id}-pets`}
                              className="text-lg font-bold text-gray-900"
                            >
                              {requiresPet
                                ? 'Who’s coming along?'
                                : 'You’re all set'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {requiresPet
                                ? 'Select one or more pets for this visit.'
                                : 'This service doesn’t require a pet selection.'}
                            </p>
                          </div>
                        </div>
                        {requiresPet ? (
                          <>
                            <label
                              htmlFor={`${id}-pet-search`}
                              className="sr-only"
                            >
                              Search your pets
                            </label>
                            <div className="relative">
                              <Search
                                size={18}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3.5 top-3.5 text-gray-500"
                              />
                              <input
                                id={`${id}-pet-search`}
                                type="search"
                                value={searchQuery}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter')
                                    event.preventDefault();
                                }}
                                onChange={(event) =>
                                  setSearchQuery(event.target.value)
                                }
                                placeholder="Find your pet"
                                className="furk-field pl-10"
                              />
                            </div>
                            <fieldset className="mt-3">
                              <legend className="sr-only">
                                Pets attending this appointment
                              </legend>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {visiblePets.map((pet) => {
                                  const selected = selectedPets.some(
                                    (item) => item.id === pet.id
                                  );
                                  return (
                                    <label
                                      key={pet.id}
                                      className="relative min-w-0 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        value={pet.id}
                                        checked={selected}
                                        disabled={
                                          !selected &&
                                          selectedPets.length >= 100
                                        }
                                        onChange={() =>
                                          setSelectedPets((previous) =>
                                            selected
                                              ? previous.filter(
                                                  (item) => item.id !== pet.id
                                                )
                                              : [...previous, pet]
                                          )
                                        }
                                        className="peer sr-only"
                                      />
                                      <span className="flex min-h-16 items-center gap-3 rounded-xl border border-gray-300 bg-white p-3 peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-disabled:opacity-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-600">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                          <PawPrint
                                            size={18}
                                            aria-hidden="true"
                                          />
                                        </span>
                                        <span className="min-w-0 flex-1 break-words text-sm font-bold text-gray-900">
                                          {pet.name}
                                        </span>
                                        <span
                                          aria-hidden="true"
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-500'}`}
                                        >
                                          {selected && <Check size={14} />}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                            {selectedPets.length >= 100 && (
                              <p
                                role="status"
                                className="mt-3 text-sm text-gray-600"
                              >
                                You can select up to 100 pets per booking.
                              </p>
                            )}
                            {loadingPets && (
                              <p
                                role="status"
                                className="mt-3 text-sm text-gray-600"
                              >
                                Loading your pets…
                              </p>
                            )}
                            {petError && (
                              <p
                                role="alert"
                                className="mt-3 text-sm text-error-700"
                              >
                                {petError}
                                <button
                                  type="button"
                                  className="ml-2 min-h-11 font-bold underline"
                                  onClick={() =>
                                    setPetRefresh((value) => value + 1)
                                  }
                                >
                                  Retry
                                </button>
                              </p>
                            )}
                            {!loadingPets &&
                              !petError &&
                              !visiblePets.length && (
                                <p className="mt-3 rounded-xl bg-white p-4 text-sm text-gray-600">
                                  {searchQuery
                                    ? `No matching pets found. Try another name${hasMorePets ? ' or load more pets' : ''}.`
                                    : 'No pets added yet. Add a pet in your profile’s Pet Profiles section, then return to book.'}
                                </p>
                              )}
                            {hasMorePets && !petError && (
                              <button
                                type="button"
                                disabled={loadingPets}
                                onClick={() => setPetPage((page) => page + 1)}
                                className="mt-2 min-h-11 text-sm font-bold text-primary-800 underline disabled:opacity-50"
                              >
                                Load more pets
                              </button>
                            )}
                            <p
                              role="status"
                              className="mt-3 text-sm text-gray-600"
                            >
                              {selectedPets.length
                                ? `${selectedPets.length} ${selectedPets.length === 1 ? 'pet' : 'pets'} selected`
                                : 'No pets selected'}{' '}
                              · {formatCredits(amount)} Furkredits per pet
                            </p>
                          </>
                        ) : (
                          <p className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">
                            Bring your pet owner QR code for confirmation at
                            your visit.
                          </p>
                        )}
                      </section>
                    </fieldset>

                    <aside
                      aria-label="Booking summary"
                      className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:sticky lg:top-0"
                    >
                      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Wallet
                          size={19}
                          className="text-primary-700"
                          aria-hidden="true"
                        />
                        Your booking
                      </h3>
                      <dl className="mt-5 space-y-4 text-sm">
                        <div className="flex gap-3">
                          <CalendarDays
                            size={18}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-primary-700"
                          />
                          <div>
                            <dt className="text-xs text-gray-600">
                              Appointment
                            </dt>
                            <dd className="mt-1 font-semibold text-gray-900">
                              {selectedDate
                                ? moment(selectedDate).format(
                                    'ddd, MMM D, YYYY'
                                  )
                                : 'Choose a date'}
                              <span className="mt-1 block font-normal text-gray-600">
                                {selectedTime
                                  ? `${formatTime(selectedTime)} · ${durationMinutes} min`
                                  : 'Choose a time'}
                              </span>
                            </dd>
                          </div>
                        </div>
                        {requiresPet && (
                          <div className="flex gap-3">
                            <PawPrint
                              size={18}
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-primary-700"
                            />
                            <div className="min-w-0">
                              <dt className="text-xs text-gray-600">Pets</dt>
                              <dd className="mt-1 break-words font-semibold text-gray-900">
                                {selectedPets.length
                                  ? selectedPets
                                      .map((pet) => pet.name)
                                      .join(', ')
                                  : 'Select your pets'}
                              </dd>
                            </div>
                          </div>
                        )}
                      </dl>
                      <div className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">
                            {requiresPet
                              ? `${formatCredits(amount)} × ${petCount} ${petCount === 1 ? 'pet' : 'pets'}`
                              : 'Service price'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCredits(bookingTotal)}
                          </span>
                        </div>
                        {coupons.map((coupon) => (
                          <div
                            key={coupon.code}
                            className="flex items-start justify-between gap-3 text-success-800"
                          >
                            <span className="flex min-w-0 items-start gap-1.5">
                              <Tag
                                size={15}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="break-all">{coupon.code}</span>
                            </span>
                            <span className="shrink-0 font-semibold">
                              −{formatCredits(Math.abs(coupon.amount))}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-end justify-between gap-2 border-t border-gray-200 pt-4">
                          <span className="font-bold text-gray-900">Total</span>
                          <div className="text-right">
                            <p className="text-2xl font-extrabold tracking-tight text-primary-800">
                              {formatCredits(total)}
                            </p>
                            <p className="text-xs text-gray-600">Furkredits</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 border-t border-gray-200 pt-4">
                        <label
                          htmlFor={`${id}-coupon`}
                          className="text-sm font-semibold text-gray-800"
                        >
                          Have a coupon?{' '}
                          <span className="font-normal text-gray-600">
                            (optional)
                          </span>
                        </label>
                        <div className="mt-2 flex gap-2">
                          <input
                            id={`${id}-coupon`}
                            value={couponCode}
                            onChange={(event) => {
                              setCouponCode(event.target.value);
                              setCouponError(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                void applyCoupon();
                              }
                            }}
                            disabled={couponApplyLoading}
                            aria-invalid={!!couponError}
                            aria-describedby={
                              couponError ? `${id}-coupon-error` : undefined
                            }
                            autoCapitalize="characters"
                            autoComplete="off"
                            placeholder="Enter code"
                            className="furk-field min-w-0 flex-1"
                          />
                          <Button
                            variant="outline"
                            disabled={!couponCode.trim() || couponApplyLoading}
                            loading={couponApplyLoading}
                            onClick={applyCoupon}
                          >
                            Apply
                          </Button>
                        </div>
                        {couponError && (
                          <p
                            id={`${id}-coupon-error`}
                            role="alert"
                            className="mt-2 text-sm text-error-700"
                          >
                            {couponError}
                          </p>
                        )}
                        <div className="sr-only" role="status">
                          {coupons.length > 0 &&
                            `${coupons.length} coupons applied. Total ${formatCredits(total)} Furkredits.`}
                        </div>
                      </div>
                      <p className="mt-5 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                        Your booking is paid with Furkredits. The merchant will
                        confirm your appointment after you submit.
                      </p>
                    </aside>
                  </div>
                </div>
                <footer className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-4">
                  {error && (
                    <p
                      role="alert"
                      className="mb-3 flex items-start gap-2 rounded-xl bg-error-50 p-3 text-sm text-error-800"
                    >
                      <AlertCircle
                        size={18}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <p className="text-xs text-gray-600">
                        Total{' '}
                        <strong className="ml-1 text-lg text-gray-900">
                          {formatCredits(total)}
                        </strong>{' '}
                        Furkredits
                      </p>
                      <p
                        id={`${id}-guidance`}
                        className="max-w-[10rem] text-right text-xs text-gray-600 sm:mt-1 sm:max-w-none sm:text-left"
                      >
                        {missingSelection}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={closeDialog}
                        className="hidden sm:inline-flex"
                      >
                        Cancel
                      </Button>
                      <button
                        type="submit"
                        disabled={!isFormValid || loading || couponApplyLoading}
                        aria-describedby={`${id}-guidance`}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600 sm:w-auto"
                      >
                        Confirm booking
                        <ArrowRight size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </footer>
              </form>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
