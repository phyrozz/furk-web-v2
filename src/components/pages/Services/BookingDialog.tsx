import { useState, useEffect, useCallback, useMemo } from 'react';
import ResizableRightSidebar from '../../common/ResizableRightSidebar';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { ToastService } from '../../../services/toast/toast-service';
import Select from '../../common/Select';
import DateInput from '../../common/DateInput';
import TimeInput from '../../common/TimeInput';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import Autocomplete from '../../common/Autocomplete';
import { BusinessHour } from './ServiceDetails';
import SuccessDialog from '../../common/SuccessDialog';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: number;
  businessHours: BusinessHour[];
}

interface PaymentMethod {
  id: number;
  code: string;
  displayName: string;
}

interface Pet {
  id: number;
  name: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, code: 'card', displayName: 'Card (Debit/Credit)' },
  { id: 2, code: 'gcash', displayName: 'GCash' },
  { id: 3, code: 'cash_on_site', displayName: 'Cash on Site' },
  { id: 4, code: 'maya', displayName: 'Maya' },
];

const BookingDialog: React.FC<BookingDialogProps> = ({ isOpen, onClose, onSuccess, serviceId, businessHours }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(3); // Default to Cash on Site
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

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
           selectedPaymentMethod !== null && 
           selectedPet !== null;
  }, [selectedDate, selectedTime, selectedPaymentMethod, selectedPet]);

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
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPaymentMethod(3);
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
        payment_method_id: selectedPaymentMethod,
        pet_ids: [selectedPet.id]
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

  return (
    <>
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
      <form onSubmit={handleSubmit} className="p-2 flex flex-col justify-between h-full">
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

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <Select
              options={PAYMENT_METHODS}
              value={PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod) || null}
              onChange={(method) => setSelectedPaymentMethod(method?.id || 3)}
              getOptionLabel={(m) => m.displayName}
              placeholder="Select payment method"
              className="mt-1"
            />
          </div>  
        </div>
        
        <div className="">
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
    </>
  );
};

export default BookingDialog;
