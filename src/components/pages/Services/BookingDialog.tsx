import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { ToastService } from '../../../services/toast/toast-service';
import Select from '../../common/Select';
import DateInput from '../../common/DateInput';
import TimeInput from '../../common/TimeInput';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: number;
}

interface PaymentMethod {
  id: number;
  code: string;
  displayName: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, code: 'card', displayName: 'Card (Debit/Credit)' },
  { id: 2, code: 'gcash', displayName: 'GCash' },
  { id: 3, code: 'cash_on_site', displayName: 'Cash on Site' },
  { id: 4, code: 'maya', displayName: 'Maya' },
];

const BookingDialog: React.FC<BookingDialogProps> = ({ isOpen, onClose, serviceId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(3); // Default to Cash on Site
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPaymentMethod(3);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const bookingDateTime = new Date(`${selectedDate}T${selectedTime}`);

      const petServicesService = new PetServicesService();
      await petServicesService.createBooking({
        service_id: serviceId,
        booking_datetime: bookingDateTime.toISOString(),
        payment_method_id: selectedPaymentMethod,
      });

      ToastService.show('Booking created successfully');
      onClose();
    } catch (err) {
      ToastService.show('Failed to create booking');
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h2"
                  className="text-2xl font-bold leading-6 text-gray-900 pb-2"
                >
                  Book Service
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <DateInput 
                      value={selectedDate ? new Date(selectedDate) : null}
                      min={new Date()}
                      max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)}
                      onChange={(date) => setSelectedDate(date ? date.toISOString().split('T')[0] : '')}
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
                    />
                  </div>

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

                  {error && <p className="text-sm text-error-600">{error}</p>}

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                      Confirm Booking
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BookingDialog;
