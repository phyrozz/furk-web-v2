import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { ToastService } from '../../../services/toast/toast-service';

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
];

const BookingDialog: React.FC<BookingDialogProps> = ({ isOpen, onClose, serviceId }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(3); // Default to Cash on Site
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form fields when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setStartTime('');
      setEndTime('');
      setSelectedPaymentMethod(3);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const petServicesService = new PetServicesService();
      const bookingDatetime = new Date(selectedDate);
      
      const data = {
        service_id: serviceId,
        booking_datetime: bookingDatetime.toISOString(),
        start_time: startTime,
        end_time: endTime,
        payment_method_id: selectedPaymentMethod
      };

      await petServicesService.createBooking(data);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Book Service
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <div className="mt-2 space-y-2">
                      {PAYMENT_METHODS.map((method) => (
                        <div key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            id={method.code}
                            name="payment_method"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <label
                            htmlFor={method.code}
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            {method.displayName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-error-600">{error}</p>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                    >
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