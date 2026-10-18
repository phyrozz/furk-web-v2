import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ResizableRightSidebar from '../../common/ResizableRightSidebar';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { ToastService } from '../../../services/toast/toast-service';
// import Select from '../../common/Select';
import TimeInput from '../../common/TimeInput';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import MultipleAutocomplete from '../../common/MultipleAutocomplete';
import SuccessDialog from '../../common/SuccessDialog';
import Input from '../../common/Input';
import { http } from '../../../utils/http';
import { Calendar, DateHeaderProps, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import { BookingEvent } from '../Merchant/BookingCalendar/BookingCalendar';
import { isAxiosError } from 'axios';
import { loginService } from '../../../services/auth/auth-service';
import { bookingRequestStorageKey, confirmedBookingResult, persistBookingRequest, restoreBookingRequest, submitOrRecoverBooking } from '../../../utils/booking-request';
import type { BookingRequest, BookingResult } from '../../../utils/booking-request';

moment.updateLocale('en', {
  week: {
    dow: 1, // monday
  }
})
const localizer = momentLocalizer(moment);

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: number;
  requiresPet: boolean;
  bookingAmount: string;
  merchantId: number;
}

// interface PaymentMethod {
//   id: number;
//   code: string;
//   displayName: string;
// }

interface Pet {
  id: number;
  name: string;
}

// const PAYMENT_METHODS: PaymentMethod[] = [
//   { id: 1, code: 'card', displayName: 'Card (Debit/Credit)' },
//   { id: 2, code: 'gcash', displayName: 'GCash' },
//   { id: 3, code: 'cash_on_site', displayName: 'Cash on Site' },
//   { id: 4, code: 'maya', displayName: 'Maya' },
// ];

const BookingDialog: React.FC<BookingDialogProps> = ({ isOpen, onClose, onSuccess, serviceId, requiresPet, bookingAmount, merchantId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(3); // Default to Cash on Site
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BookingRequest | null>(null);
  const [requestStorageKey, setRequestStorageKey] = useState<string | null>(null);
  const [requestReady, setRequestReady] = useState(false);
  const submissionInFlight = useRef(false);
  const [couponApplyLoading, setCouponApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [subtotal, setSubtotal] = useState<{ code: string, description: string, amount?: number }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [calendarDate, setCalendarDate] = useState(() => new Date(moment().utcOffset(8).format('YYYY-MM-DDTHH:mm:ss')));
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>(() => {
    const today = moment().utcOffset(8);
    const start = new Date(today.year(), today.month(), -9);
    const end = new Date(today.year(), today.month() + 1, 10);
    return { start, end };
  });

  const petServicesService = useMemo(() => new PetServicesService(), []);
  const calendarNow = new Date(moment(now).utcOffset(8).format('YYYY-MM-DDTHH:mm:ss'));
  const petCountForPricing = selectedPets.length > 0 ? selectedPets.length : 1;
  const computedBookingAmount = amount * petCountForPricing;

  const formatLocalDate = useCallback((date: Date) => moment(date).format('YYYY-MM-DD'), []);

  const completeBooking = useCallback((result: BookingResult, storageKey: string, requestId: string) => {
    confirmedBookingResult(result, requestId);
    // A local callback/storage failure must not turn a committed booking into a
    // failed submission. An uncleared record is safe to reconcile on reopening.
    try { localStorage.removeItem(storageKey); } catch (error) { console.error(error); }
    setPendingRequest(null);
    setError(null);
    setEarnedPoints(result.data.added_points || 0);
    setShowSuccessDialog(true);
    try { onSuccess(); } catch (error) { console.error(error); }
  }, [onSuccess]);

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
            const result = await petServicesService.getBookingRequest(request.request_id);
            if (active) completeBooking(result, key, request.request_id);
          } catch {
            if (active) setError('Your previous booking result is not confirmed yet. Check its status or retry the same booking request.');
          } finally {
            submissionInFlight.current = false;
            if (active) setLoading(false);
          }
        }
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Unable to restore your booking request. Please check booking history.');
      }
    };
    void restore();
    return () => { active = false; };
  }, [isOpen, serviceId, petServicesService, completeBooking]);

  const selectedDayTimes = useMemo(() => (
    (availableSlots[selectedDate] || []).filter((time) => (
      new Date(`${selectedDate}T${time}+08:00`).getTime() > now
    ))
  ), [availableSlots, selectedDate, now]);

  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (selectedTime && !selectedDayTimes.includes(selectedTime)) setSelectedTime('');
  }, [selectedTime, selectedDayTimes]);

  const isFormValid = useMemo(() => {
    return requestReady && !showSuccessDialog && selectedDate !== '' &&
           selectedDayTimes.includes(selectedTime) && !availabilityLoading && !availabilityError &&
           (requiresPet ? selectedPets.length > 0 : true);
  }, [requestReady, showSuccessDialog, selectedDate, selectedTime, selectedDayTimes, selectedPets, requiresPet, availabilityLoading, availabilityError]);

  const fetchPets = useCallback(async (limit: number, offset: number, query: string = '') => {
    try {
      const response = await petServicesService.listPets(limit, offset);
      const filteredPets = response.data.filter((pet: any) =>
        pet.name.toLowerCase().includes(query.toLowerCase())
      );
      return filteredPets.map((pet: any) => ({ id: pet.id, name: pet.name }));
    } catch (err) {
      ToastService.show('Failed to load pets');
      return [];
    }
  }, [petServicesService]);

  const { items: pets, loading: loadingPets, hasMore, loadMore } = useLazyLoad<Pet>({
    fetchData: fetchPets,
    keyword: searchQuery,
    enabled: isOpen && requiresPet,
  });

  useEffect(() => {
    setAmount(parseFloat(bookingAmount));
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPets([]);
      setError(null);
      setSearchQuery('');
    }
  }, [isOpen, requiresPet, bookingAmount]);

  useEffect(() => {
    // Coupons are validated against the computed total, so reset when pet count changes.
    setSubtotal([]);
    setCouponCode('');
  }, [selectedPets.length]);

  const searchItems = useCallback(async (query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInFlight.current || !requestReady || !requestStorageKey || showSuccessDialog) return;
    submissionInFlight.current = true;
    setError(null);
    setLoading(true);
    let request = pendingRequest;
    let saved = !!request;
    try {
      if (!request) {
        const bookingDateTime = new Date(`${selectedDate}T${selectedTime}+08:00`);
        if (!isFormValid || bookingDateTime.getTime() <= Date.now()) {
          setError('Please select an available future appointment and any required pets.');
          setAvailabilityRefresh((value) => value + 1);
          return;
        }
        request = {
          request_id: crypto.randomUUID(), service_id: serviceId,
          booking_datetime: bookingDateTime.toISOString(),
          pet_ids: requiresPet ? selectedPets.map((pet) => pet.id) : [],
          coupon_codes: subtotal.map((item) => item.code),
        };
        persistBookingRequest(localStorage, requestStorageKey, request);
        saved = true;
        setPendingRequest(request);
      }
      const response = await submitOrRecoverBooking(petServicesService, request);
      completeBooking(response, requestStorageKey, request.request_id);
    } catch (err) {
      const details = isAxiosError<{ error?: string; booking_request_status?: string }>(err) ? err.response?.data : undefined;
      if (details?.booking_request_status === 'not_created') {
        try {
          localStorage.removeItem(requestStorageKey);
          setPendingRequest(null);
        } catch (error) { console.error(error); }
        setAvailabilityRefresh((value) => value + 1);
      }
      const message = details?.error || (saved
        ? 'The booking result is not confirmed yet. Check its status or retry the same request.'
        : 'Unable to save this booking request. Please check booking history before trying again.');
      ToastService.show(message);
      setError(message);
    } finally {
      submissionInFlight.current = false;
      setLoading(false);
    }
  };

  const checkBookingStatus = async () => {
    if (!pendingRequest || !requestStorageKey || submissionInFlight.current) return;
    submissionInFlight.current = true;
    setLoading(true);
    try {
      completeBooking(await petServicesService.getBookingRequest(pendingRequest.request_id), requestStorageKey, pendingRequest.request_id);
    } catch {
      setError('No completed result is available yet. You can retry this same booking request.');
    } finally {
      submissionInFlight.current = false;
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onClose();
    onBookingDialogClose();
    window.location.reload();
    setLoading(false);
  };

  const onBookingDialogClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedPets([]);
    setError(null);
    setSearchQuery('');
    setCouponCode('');
    setEarnedPoints(0);
    setSubtotal([]);
    setAmount(0);
    onClose();
  }

  const handleApplyClick = async () => {
    setCouponApplyLoading(true);

    // Check the subtotal state if the coupon codes stored are unique to avoid duplicates
    if (subtotal.some(item => item.description.includes(`Coupon (${couponCode})`))) {
      setError('This coupon has already been applied');
      setCouponApplyLoading(false);
      return;
    }

    // Also, when the grand total is already 0, never accept any coupons
    const currentTotal = computedBookingAmount + (subtotal.reduce((acc, item) => acc + (item.amount || 0), 0));
    if (currentTotal <= 0) {
      setError('Cannot apply coupon when total amount is already 0');
      setCouponApplyLoading(false);
      return;
    }
    try {
      const response: { success?: boolean, message?: string, data?: any, error?: any } = await http.post('/booking/validate-coupon', { code: couponCode });

      if (response.success && !response.success) {
        setCouponApplyLoading(false);
        return;
      }

      if (response.message && response.message === 'Coupon code is invalid') {
        setError('Coupon code is invalid');
        setCouponApplyLoading(false);
        return;
      }

      let discountAmount = 0;

      if (response.data.discount_type === 'percent') {
        discountAmount = computedBookingAmount * (response.data.discount_value * 0.01);
      } else if (response.data.discount_type === 'fixed') {
        discountAmount = response.data.discount_value;
      }

      const newSubtotal = [...subtotal, { code: response.data.code, description: `Coupon (${response.data.code})`, amount: -discountAmount }];
      const newTotal = computedBookingAmount + newSubtotal.reduce((acc, item) => acc + (item.amount || 0), 0);
      
      setSubtotal(newSubtotal);
      if (newTotal < 0) {
        // Adjust the last coupon amount to make total exactly 0
        const adjustedAmount = -(computedBookingAmount + subtotal.reduce((acc, item) => acc + (item.amount || 0), 0));
        setSubtotal([...subtotal, { code: response.data.code, description: `Coupon (${response.data.code})`, amount: adjustedAmount }]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response.data.error || 'Unknown error');
      console.error('Error validating coupon code:', err);
    } finally {
      setCouponApplyLoading(false);
    }
  }

  // For the Calendar component
  const formats = {
    agendaDateFormat: 'MMM D',
    agendaTimeFormat: 'hh:mm A',
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format('hh:mm A')} - ${moment(end).format('hh:mm A')}`;
    }
  };

  const calendarStyle = {
    backgroundColor: '#ffffff',
    fontSize: '0.75rem',
    '.rbcToolbar': {
      marginBottom: '0.75rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    '.rbcToolbar button': {
      color: '#374151',
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: '0.375rem',
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
        transform: 'translateY(-1px)'
      },
      '&.rbcActive': {
        backgroundColor: '#4F46E5',
        borderColor: '#4338CA',
        color: '#ffffff',
        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
      }
    },
    '.rbcMonthView': {
      border: '1px solid #E5E7EB',
      borderRadius: '0.375rem',
      overflow: 'hidden'
    },
    '.rbcDayBg': {
      backgroundColor: '#ffffff',
      transition: 'background-color 0.2s ease'
    },
    '.rbcOffRangeBg': {
      backgroundColor: '#F9FAFB'
    },
    '.rbcToday': {
      backgroundColor: '#EEF2FF',
      '&:hover': {
        backgroundColor: '#E0E7FF'
      }
    },
    '.rbcEvent': {
      backgroundColor: '#4F46E5',
      borderRadius: '0.25rem',
      color: '#ffffff',
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      border: 'none',
      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#4338CA',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 6px rgba(79, 70, 229, 0.25)'
      }
    },
    '.rbcSelected': {
      backgroundColor: '#9c7a54',
      boxShadow: '0 4px 6px rgba(156, 122, 84, 0.3)'
    },
    '.rbcHeader': {
      padding: '0.5rem',
      fontWeight: 600,
      borderBottom: '1px solid #E5E7EB',
      color: '#1F2937',
      textTransform: 'uppercase',
      fontSize: '0.625rem',
      letterSpacing: '0.05em'
    },
    '.rbcAgendaView table': {
      border: '1px solid #E5E7EB',
      borderRadius: '0.375rem',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    '.rbcAgendaView table thead': {
      backgroundColor: '#F9FAFB',
      color: '#374151'
    },
    '.rbcAgendaView table td': {
      padding: '0.5rem',
      borderBottom: '1px solid #E5E7EB',
      color: '#4B5563',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#F9FAFB'
      }
    },
    '.rbcTimeView': {
      border: '1px solid #E5E7EB',
      borderRadius: '0.375rem',
      overflow: 'hidden'
    },
    '.rbcTimeslotGroup': {
      borderBottom: '1px solid #E5E7EB'
    },
    '.rbcTimeHeader': {
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#F9FAFB'
    },
    '.rbcCurrentTimeIndicator': {
      backgroundColor: '#DC2626',
      height: '2px'
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailableSlots({});

    const fetchAvailability = async () => {
      try {
        const response = await new PetServicesService().listClosuresAndBreaks(
          dateRange.start, dateRange.end, merchantId, serviceId,
        );
        if (!active) return;
        if (!response.data?.available_slots) throw new Error('Missing availability');
        setAvailableSlots(response.data.available_slots);
        setDurationMinutes(response.data.duration_minutes);
      } catch {
        if (active) setAvailabilityError('Unable to load appointment times. Please retry.');
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    };
    void fetchAvailability();
    return () => { active = false; };
  }, [isOpen, serviceId, merchantId, dateRange, availabilityRefresh]);

  const handleNavigate = (newDate: Date) => {
    setCalendarDate(newDate);
    const start = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const end = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
    setDateRange({
      start: moment(start).subtract(10, 'days').toDate(),
      end: moment(end).add(10, 'days').toDate(),
    });
  };

  const handleRangeChange = () => {
    setSelectedDate('');
    setSelectedTime('');
  };

  const isDateSelectable = useCallback((date: Date) => {
    const dateKey = formatLocalDate(date);
    const today = moment(now).utcOffset(8).format('YYYY-MM-DD');
    const lastDate = moment(now).utcOffset(8).add(6, 'months').format('YYYY-MM-DD');
    return !availabilityLoading && !availabilityError && dateKey >= today && dateKey <= lastDate &&
      (availableSlots[dateKey] || []).some((time) => new Date(`${dateKey}T${time}+08:00`).getTime() > now);
  }, [availableSlots, availabilityLoading, availabilityError, formatLocalDate, now]);

  const dayPropGetter = (date: Date) => {
    const selectable = isDateSelectable(date);
    const dateKey = formatLocalDate(date);
    const isToday = dateKey === moment(now).utcOffset(8).format('YYYY-MM-DD');
    return {
      style: {
        backgroundColor: selectedDate === dateKey ? '#f5efe4' : isToday ? '#fef9c3' : selectable ? '#ffffff' : '#d1d1d1',
        cursor: selectable ? 'pointer' : 'not-allowed',
      },
    };
  };

  const selectionEvents: BookingEvent[] = selectedDate && selectedTime ? [{
    id: -1,
    title: 'Selected appointment',
    start: new Date(`${selectedDate}T${selectedTime}`),
    end: moment(`${selectedDate}T${selectedTime}`).add(durationMinutes, 'minutes').toDate(),
    status: 'selected',
    bookingDetails: null,
  }] : [];

  const eventPropGetter = () => ({
    style: { backgroundColor: '#f5efe4', border: '2px dashed #9c7a54', color: '#000' },
  });

  const handleSelectDate = useCallback((date: Date) => {
    if (!isDateSelectable(date)) return;
    setSelectedDate(formatLocalDate(date));
    setSelectedTime('');
  }, [formatLocalDate, isDateSelectable]);

  const calendarComponents = useMemo(() => ({
    dateHeader: ({ date, label }: DateHeaderProps) => {
      const selectable = isDateSelectable(date);
      const isSelected = selectedDate === formatLocalDate(date);

      return (
        <button
          type="button"
          disabled={!selectable}
          aria-label={`${selectable ? 'Select' : 'Unavailable'} ${moment(date).format('dddd, MMMM D')}`}
          aria-pressed={isSelected}
          onClick={() => handleSelectDate(date)}
          className={`rbc-button-link min-h-10 w-full rounded px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${
            selectable ? 'cursor-pointer hover:bg-primary-100' : 'cursor-not-allowed text-gray-400'
          } ${isSelected ? 'bg-primary-100 font-bold text-primary-800' : ''}`}
        >
          {label}
        </button>
      );
    },
  }), [formatLocalDate, handleSelectDate, isDateSelectable, selectedDate]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    handleSelectDate(slotInfo.start);
  }, [handleSelectDate]);

  return (
    <div className="z-50">
      <SuccessDialog 
        isOpen={showSuccessDialog} 
        onClose={handleSuccessDialogClose} 
        points={earnedPoints} 
      />
      <ResizableRightSidebar
        isOpen={isOpen}
        onClose={onBookingDialogClose}
        title="Book Service"
      >
        <form onSubmit={handleSubmit} className="p-2 flex flex-col justify-between h-full select-none">
          {pendingRequest ? (
            <div className="flex flex-col gap-4 p-3">
              <p role="status" className="text-sm text-gray-700">
                {loading ? 'Submitting or checking your booking...' : 'The result of this booking has not been confirmed yet. Check its status or retry the same request.'}
              </p>
              <p className="text-sm font-medium">
                Appointment: {moment(pendingRequest.booking_datetime).utcOffset(8).format('MMMM D, YYYY [at] h:mm A')} (Philippine Time)
              </p>
              {error && <p role="alert" className="text-sm text-error-600">{error}</p>}
              <Button type="button" variant="outline" onClick={checkBookingStatus} disabled={loading}>Check status</Button>
              <Button type="submit" variant="primary" loading={loading} disabled={loading}>Retry same booking</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
            </div>
          ) : (
          <>
          <div className="flex flex-col gap-4">
            <div className="">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mb-1 text-xs text-gray-500">Tap an available date number to select it. Times are in Philippine Time (UTC+8).</p>

              <div style={{ width: '100%', aspectRatio: '1' }} className="cursor-pointer">
                <Calendar
                  localizer={localizer}
                  date={calendarDate}
                  getNow={() => calendarNow}
                  events={selectionEvents}
                  onNavigate={handleNavigate}
                  onRangeChange={handleRangeChange}
                  eventPropGetter={eventPropGetter}
                  dayPropGetter={dayPropGetter}
                  components={{ month: calendarComponents }}
                  onSelectSlot={handleSelectSlot}
                  startAccessor="start"
                  endAccessor="end"
                  defaultView="month"
                  views={['month']}
                  formats={formats}
                  length={30}
                  style={calendarStyle}
                  selectable
                />
              </div>
{/* 
              <DateInput 
                value={selectedDate ? new Date(selectedDate) : null}
                min={new Date()}
                max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)}
                onChange={(date) => {
                  setSelectedDate(date ? date.toISOString().split('T')[0] : '');
                  setSelectedTime(''); // Reset time when date changes
                }}
                className="mt-1"
              /> */}
            </div>

            <div className="grid grid-cols-2 lg:flex md:items-center gap-2 lg:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-gray-400" />
                <span className="text-xs md:text-sm">Unavailable</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#fef9c3]" />
                <span className="text-xs md:text-sm">Today</span>
              </div>
            </div>

            <div>
              {availabilityLoading && <p role="status" className="text-sm text-gray-500">Loading appointment times...</p>}
              {availabilityError && (
                <div role="alert" className="text-sm text-red-600">
                  {availabilityError}
                  <button type="button" className="ml-2 underline" onClick={() => setAvailabilityRefresh((value) => value + 1)}>Retry</button>
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <TimeInput 
                value={selectedTime ? new Date(`1970-01-01T${selectedTime}`) : null}
                onChange={(time) => setSelectedTime(time ? time.toTimeString().split(' ')[0] : '')}
                className="mt-1"
                minuteStep={30}
                allowedTimes={selectedDayTimes}
                disabled={!selectedDate || selectedDayTimes.length === 0 || availabilityLoading || !!availabilityError}
              />
            </div>

            {isOpen && (requiresPet ? (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Pets</label>
                <MultipleAutocomplete
                  options={pets}
                  values={selectedPets}
                  onChange={setSelectedPets}
                  getOptionLabel={(pet) => pet.name}
                  placeholder="Select one or more pets"
                  className="mt-1"
                  onLoadMore={loadMore}
                  onSearch={searchItems}
                  isLoading={loadingPets}
                  hasMore={hasMore}
                  maxSelections={100}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This service does not require a pet to be selected. Your pet owner QR will be used for confirmation.
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon code</label>
              <Input id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <div className="flex justify-end items-center">
                <Button type="button" variant="ghost" onClick={() => handleApplyClick()} loading={couponApplyLoading}>
                  Apply
                </Button>
              </div>
              
            </div>
            <div>
              {subtotal.filter(item => item.description.includes('Coupon')).map((coupon, index) => (
                <div 
                  key={index}
                  className="p-3 mb-2 bg-primary-50 border border-primary-200 rounded-lg flex justify-between items-center select-none"
                >
                  <div className="flex items-center max-w-[50%]">
                    <svg className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="text-sm font-medium text-primary-700 truncate">
                      {coupon.description}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 flex-shrink-0">
                    {Math.abs(coupon.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="font-light text-xs">Furkredits</span>
                  </span>
                </div>
              ))}
            </div>

            {/* <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <Select
                options={PAYMENT_METHODS}
                value={PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod) || null}
                onChange={(method) => setSelectedPaymentMethod(method?.id || 3)}
                getOptionLabel={(m) => m.displayName}
                placeholder="Select payment method"
                className="mt-1"
              />
            </div>   */}
          </div>
          
          <div className="mt-4 border-t pt-4 select-none">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Booking Amount</span>
                <span className="text-lg font-bold text-primary-600">
                  {Number(computedBookingAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-xs font-normal"> Furkredits</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Pets Selected</span>
                <span className="text-gray-700">{requiresPet ? selectedPets.length : 'N/A'}</span>
              </div>
              
              {subtotal.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {item.description.length > 30 ? `${item.description.substring(0, 27)}...` : item.description}
                  </span>
                  <span className="text-primary-600">
                    {item.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    <span className="text-xs"> Furkredits</span>
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-sm font-medium text-gray-700">Total Amount</span>
                <span className="text-lg font-bold text-primary-600">
                  {(computedBookingAmount + (subtotal.reduce((acc, item) => acc + (item.amount || 0), 0)))
                    .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-xs font-normal"> Furkredits</span>
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-error-600">{error}</p>}

            <div className="mt-6 flex justify-end space-x-3 mb-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading}
                disabled={!isFormValid || loading}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
          </>
          )}
        </form>
      </ResizableRightSidebar>
    </div>
  );
};

export default BookingDialog;
