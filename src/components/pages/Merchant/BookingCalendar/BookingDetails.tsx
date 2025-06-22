import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Button from '../../../common/Button';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import PawLoading from '../../../common/PawLoading';
import Badge from '../../../common/Badge';
import { X } from 'lucide-react';
import Modal from '../../../common/Modal';

interface BookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  onUpdate: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  isOpen,
  onClose,
  bookingId,
  onUpdate,
}) => {
  const [height, setHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [startLoading, setStartLoading] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [completeLoading, setCompleteLoading] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [confirmStatusChange, setConfirmStatusChange] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'confirm' | 'start' | 'cancel' | 'complete' | null>(null);

  const bookingsService = new MerchantBookingsService();

  const minHeight = 100;
  const maxHeight = window.innerHeight * 0.9;

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        setHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
      }
    },
    [isResizing, minHeight, maxHeight]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    setDataLoading(true);
    const fetchBookingDetails = async () => {
      if (bookingId) {
        const data = await bookingsService.getBookingDetails(bookingId);
        setBookingDetails(data.data);
      }
      setDataLoading(false);
    };
    fetchBookingDetails();
  }, [bookingId]);

  const initiateAction = (action: 'confirm' | 'start' | 'cancel' | 'complete') => {
    setPendingAction(action);
    setConfirmStatusChange(true);
  };

  const handleAction = async () => {
    if (!pendingAction || !bookingId) return;
    setConfirmStatusChange(false);

    try {
      switch (pendingAction) {
        case 'confirm':
          setConfirmLoading(true);
          await bookingsService.confirmBooking(bookingId);
          break;
        case 'start':
          setStartLoading(true);
          await bookingsService.startService(bookingId);
          break;
        case 'cancel':
          setCancelLoading(true);
          await bookingsService.cancelBooking(bookingId);
          break;
        case 'complete':
          setCompleteLoading(true);
          await bookingsService.completeService(bookingId);
          break;
      }
      const updatedBooking = await bookingsService.getBookingDetails(bookingId);
      setBookingDetails(updatedBooking);
      onUpdate();
      onClose();
    } catch (error) {
      console.error(`Error ${pendingAction} booking:`, error);
    } finally {
      setConfirmLoading(false);
      setStartLoading(false);
      setCancelLoading(false);
      setCompleteLoading(false);
      setConfirmStatusChange(false);
      setPendingAction(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ height: height }}
          className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-lg flex flex-col z-50 cursor-default"
          key="booking-details"
        >
          <div
            className="w-full h-[10px] bg-gray-200 cursor-ns-resize rounded-t-lg flex items-center justify-center"
            onMouseDown={startResizing}
          >
            <div className="w-10 h-[6px] bg-gray-400 rounded-full" />
          </div>
          <div className="flex flex-col h-full">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Booking Details - {bookingDetails?.service?.name}</h2>
                <Button onClick={onClose} variant="ghost" color="primary">
                  Close
                </Button>
              </div>
              {!dataLoading ? (
                <div className="cursor-default">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black">Booking Information</h3>
                      <p><strong>Service:</strong> {bookingDetails?.service?.name}</p>
                      <p><strong>Requested Date:</strong> {moment(bookingDetails?.booking_datetime || bookingDetails?.start_datetime).format('MMMM Do YYYY, h:mm a')}</p>
                      {bookingDetails?.start_datetime && (
                        <>
                          <p><strong>Start:</strong> {moment(bookingDetails?.start_datetime).format('MMMM Do YYYY, h:mm a')}</p>
                          <p><strong>End:</strong> {bookingDetails?.end_datetime ? moment(bookingDetails.end_datetime).format('MMMM Do YYYY, h:mm a') : 'Service Ongoing'}</p>
                        </>
                      )}
                      <p><strong>Status:</strong> {bookingDetails && <Badge status={bookingDetails?.status} />}</p>
                      <p><strong>Payment Status:</strong> {bookingDetails?.payment_status || 'N/A'}</p>
                      {bookingDetails?.remarks && <p><strong>Remarks:</strong> {bookingDetails.remarks}</p>}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-black">Customer Information</h3>
                      <p><strong>Name:</strong> {bookingDetails?.user?.first_name} {bookingDetails?.user?.last_name}</p>
                      <p><strong>Email:</strong> {bookingDetails?.user?.email}</p>
                      <p><strong>Phone:</strong> {bookingDetails?.user?.phone_number || 'N/A'}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-black">Pet Information</h3>
                      <div className="flex justify-between items-start">
                        <div className="space-y-4">
                          <p><strong>Name:</strong> {bookingDetails?.pet?.name || 'N/A'}</p>
                          <p><strong>Species:</strong> {bookingDetails?.pet?.species || 'N/A'}</p>
                          <p><strong>Breed:</strong> {bookingDetails?.pet?.breed || 'N/A'}</p>
                          <p><strong>Sex:</strong> {bookingDetails?.pet?.sex || 'N/A'}</p>
                          <p><strong>Weight:</strong> {bookingDetails?.pet?.weight ? `${bookingDetails.pet.weight} kg` : 'N/A'}</p>
                          <p><strong>Color:</strong> {bookingDetails?.pet?.color || 'N/A'}</p>
                          <p><strong>Neutered?:</strong> {bookingDetails?.pet?.is_neutered ? 'Yes' : 'No'}</p>
                          <p><strong>Birth Date:</strong> {bookingDetails?.pet?.birth_date || 'N/A'}</p>
                          <p><strong>Notes:</strong> {bookingDetails?.pet?.notes || 'N/A'}</p>
                        </div>
                        {bookingDetails?.pet?.profile_image && (
                          <img 
                            src={bookingDetails.pet.profile_image} 
                            alt={`${bookingDetails.pet.name}'s photo`}
                            className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => {
                              setSelectedImage(bookingDetails?.pet?.profile_image);
                              setImageModalOpen(true);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <PawLoading />
                </div>
              )}
            </div>
            {bookingDetails && (
              <div className="border-t p-4 bg-white">
                <div className="flex gap-2 justify-end">
                  {bookingDetails.status === 'pending' && (
                    <Button
                      loading={confirmLoading}
                      disabled={dataLoading}
                      onClick={() => initiateAction('confirm')}
                    >
                      Confirm Booking
                    </Button>
                  )}
                  
                  {bookingDetails.status === 'confirmed' && (
                    <>
                      <Button
                        loading={cancelLoading}
                        variant="outline"
                        color="red"
                        disabled={dataLoading}
                        onClick={() => initiateAction('cancel')}
                      >
                        Cancel Booking
                      </Button>
                      <Button
                        loading={startLoading}
                        disabled={dataLoading}
                        onClick={() => initiateAction('start')}
                      >
                        Start Service
                      </Button>
                    </>
                  )}
                  
                  {bookingDetails.status === 'in_progress' && (
                    <Button
                      loading={completeLoading}
                      disabled={dataLoading}
                      onClick={() => initiateAction('complete')}
                    >
                      Complete Service
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {imageModalOpen && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setImageModalOpen(false)}
            key="image-modal"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={selectedImage}
                    alt="Pet profile"
                    className="max-h-[80vh] max-w-[90vw] rounded-lg"
                />
                <button
                    onClick={() => setImageModalOpen(false)}
                    className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
                >
                    <X size={24} />
                </button>
            </motion.div>
        </motion.div>
    )}

    {confirmStatusChange && (
      <Modal
        key="confirm-modal"
        isOpen={confirmStatusChange}
        onClose={() => {
          setConfirmStatusChange(false);
          setPendingAction(null);
        }}
        onConfirm={handleAction}
        showConfirm
        showCancel
        title="Confirm"
      >
        <p>Are you sure you want to change the status of this booking? This action cannot be undone.</p>
      </Modal>
    )}
    </AnimatePresence>
  );
};

export default BookingDetails;