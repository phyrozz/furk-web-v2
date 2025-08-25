import { useState, useEffect, useCallback, useMemo } from 'react';
import ResizableRightSidebar from '../../common/ResizableRightSidebar';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { ToastService } from '../../../services/toast/toast-service';
// import Select from '../../common/Select';
import DateInput from '../../common/DateInput';
import TimeInput from '../../common/TimeInput';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import Autocomplete from '../../common/Autocomplete';
import { BusinessHour } from './ServiceDetails';
import SuccessDialog from '../../common/SuccessDialog';
import Input from '../../common/Input';
import { http } from '../../../utils/http';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: number;
  businessHours: BusinessHour[];
  bookingAmount: string;
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

const BookingDialog: React.FC<BookingDialogProps> = ({ isOpen, onClose, onSuccess, serviceId, businessHours, bookingAmount }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(3); // Default to Cash on Site
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponApplyLoading, setCouponApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [subtotal, setSubtotal] = useState<{ code: string, description: string, amount?: number }[]>([]);

  const petServicesService = new PetServicesService();

  const getBusinessHoursForDate = useCallback((date: string) => {
    const selectedDay = new Date(date).getDay();
    // Convert Sunday (0) to 6, and other days subtract 1 to match 0=Monday format
    const adjustedDay = selectedDay === 0 ? 6 : selectedDay - 1;
    return businessHours.find(hour => hour.day_of_week === adjustedDay);
  }, [businessHours]);

  const getTimeConstraints = useMemo(() => {
    if (!selectedDate) return { min: undefined, max: undefined };

    const businessHour = getBusinessHoursForDate(selectedDate);
    if (!businessHour) return { min: undefined, max: undefined };

    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Parse business hours
    const [openHours, openMinutes] = businessHour.open_time.split(':').map(Number);
    const [closeHours, closeMinutes] = businessHour.close_time.split(':').map(Number);

    let min = new Date();
    let max = new Date();

    if (isToday) {
      // If current time is after opening time, use current time as minimum
      if (currentHours > openHours || (currentHours === openHours && currentMinutes >= openMinutes)) {
        min.setHours(currentHours, currentMinutes, 0, 0);
      } else {
        min.setHours(openHours, openMinutes, 0, 0);
      }
    } else {
      min.setHours(openHours, openMinutes, 0, 0);
    }

    max.setHours(closeHours, closeMinutes, 0, 0);

    // If current time is after closing time on the same day, disable all times
    if (isToday && (currentHours > closeHours || (currentHours === closeHours && currentMinutes >= closeMinutes))) {
      return { min: undefined, max: undefined };
    }

    return { min, max };
  }, [selectedDate, getBusinessHoursForDate]);

  const isFormValid = useMemo(() => {
    return selectedDate !== '' && 
           selectedTime !== '' && 
           selectedPet !== null;
  }, [selectedDate, selectedTime, selectedPet]);

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
  }, []);

  const { items: pets, loading: loadingPets, hasMore, loadMore } = useLazyLoad<Pet>({
    fetchData: fetchPets,
    keyword: searchQuery,
    enabled: isOpen,
  });

  useEffect(() => {
    setAmount(parseFloat(bookingAmount));
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPet(null);
      setError(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const searchItems = useCallback(async (query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedPet) {
      setError('Please select a pet.');
      setLoading(false);
      return;
    }

    try {
      const bookingDateTime = new Date(`${selectedDate}T${selectedTime}`);

      const response = await petServicesService.createBooking({
        service_id: serviceId,
        booking_datetime: bookingDateTime.toISOString(),
        pet_ids: [selectedPet.id],
        coupon_codes: subtotal.map(item => item.code)
      });

      // Get the added points from the response
      const addedPoints = response.data.added_points || 0;
      setEarnedPoints(addedPoints);
      
      // Show success dialog instead of closing immediately
      setShowSuccessDialog(true);
      
      // Call onSuccess to update parent component
      onSuccess();
    } catch (err: any) {
      console.log(err.response.data.error);
      if (err.response && err.response.data && err.response.data.error) {
        ToastService.show(err.response.data.error);
        setError(err.response.data.error);
      } else {
        ToastService.show('Failed to create booking. Please try again.');
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onClose();
    setLoading(false);
  };

  const handleApplyClick = async () => {
    setCouponApplyLoading(true);

    // Check the subtotal state if the coupon codes stored are unique to avoid duplicates
    if (subtotal.some(item => item.description.includes(`Coupon (${couponCode})`))) {
      setError('This coupon has already been applied');
      setCouponApplyLoading(false);
      return;
    }

    // Also, when the grand total is already 0, never accept any coupons
    const currentTotal = amount + (subtotal.reduce((acc, item) => acc + (item.amount || 0), 0));
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
        discountAmount = amount * (response.data.discount_value * 0.01);
      } else if (response.data.discount_type === 'fixed') {
        discountAmount = response.data.discount_value;
      }

      const newSubtotal = [...subtotal, { code: response.data.code, description: `Coupon (${response.data.code})`, amount: -discountAmount }];
      const newTotal = amount + newSubtotal.reduce((acc, item) => acc + (item.amount || 0), 0);
      
      setSubtotal(newSubtotal);
      if (newTotal < 0) {
        // Adjust the last coupon amount to make total exactly 0
        const adjustedAmount = -(amount + subtotal.reduce((acc, item) => acc + (item.amount || 0), 0));
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

  return (
    <div className="z-50">
      <SuccessDialog 
        isOpen={showSuccessDialog} 
        onClose={handleSuccessDialogClose} 
        points={earnedPoints} 
      />
      <ResizableRightSidebar
        isOpen={isOpen}
        onClose={onClose}
        title="Book Service"
      >
        <form onSubmit={handleSubmit} className="p-2 flex flex-col justify-between h-full select-none">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <DateInput 
                value={selectedDate ? new Date(selectedDate) : null}
                min={new Date()}
                max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)}
                onChange={(date) => {
                  setSelectedDate(date ? date.toISOString().split('T')[0] : '');
                  setSelectedTime(''); // Reset time when date changes
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <TimeInput 
                value={selectedTime ? new Date(`1970-01-01T${selectedTime}`) : null}
                onChange={(time) => setSelectedTime(time ? time.toTimeString().split(' ')[0] : '')}
                className="mt-1"
                minuteStep={30}
                min={getTimeConstraints.min}
                max={getTimeConstraints.max}
                disabled={!selectedDate || !getBusinessHoursForDate(selectedDate)}
              />
            </div>

            {isOpen && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Pet</label>
                <Autocomplete
                  options={pets}
                  value={selectedPet}
                  onChange={setSelectedPet}
                  getOptionLabel={(pet) => pet.name}
                  placeholder="Select your pet"
                  className="mt-1"
                  onLoadMore={loadMore}
                  onSearch={searchItems}
                  isLoading={loadingPets}
                  hasMore={hasMore}
                />
              </div>
            )}

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
                  {Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-xs font-normal"> Furkredits</span>
                </span>
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
                  {(amount + (subtotal.reduce((acc, item) => acc + (item.amount || 0), 0)))
                    .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-xs font-normal"> Furkredits</span>
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-error-600">{error}</p>}

            <div className="mt-6 flex justify-end space-x-3">
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
        </form>
      </ResizableRightSidebar>
    </div>
  );
};

export default BookingDialog;
