import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Button from '../../../common/Button';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import PawLoading from '../../../common/PawLoading';
import Badge from '../../../common/Badge';
import { X } from 'lucide-react';
import Modal from '../../../common/Modal';
import ResizableRightSidebar from '../../../common/ResizableRightSidebar';

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

  useEffect(() => {
    setDataLoading(true);
    const fetchBookingDetails = async () => {
      if (bookingId) {
        const data: any = await bookingsService.getBookingDetails(bookingId);
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
      setBookingDetails(updatedBooking.data);
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

  const bookingPets = bookingDetails?.pets || (bookingDetails?.pet ? [bookingDetails.pet] : []);

  return (
    <div className="z-50">
      {isOpen && (
        <ResizableRightSidebar
          isOpen={isOpen}
          onClose={onClose}
          title="Booking Details"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                {!dataLoading ? (
                  <div className="cursor-default">
                    <div className="grid grid-cols-1 gap-6">
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
                        {bookingPets.map((pet: any, index: number) => (
                          <div key={pet?.id ?? index} className="border rounded-lg p-3">
                            <p className="font-semibold mb-2">Pet #{index + 1}</p>
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <p><strong>Name:</strong> {pet?.name || 'N/A'}</p>
                                <p><strong>Species:</strong> {pet?.species || 'N/A'}</p>
                                <p><strong>Breed:</strong> {pet?.breed || 'N/A'}</p>
                                <p><strong>Sex:</strong> {pet?.sex || 'N/A'}</p>
                                <p><strong>Weight:</strong> {pet?.weight_kg ? `${pet.weight_kg} kg` : 'N/A'}</p>
                                <p><strong>Color:</strong> {pet?.color || 'N/A'}</p>
                                <p><strong>Neutered?:</strong> {pet?.is_neutered ? 'Yes' : 'No'}</p>
                                <p><strong>Birth Date:</strong> {pet?.birth_date || 'N/A'}</p>
                                <p><strong>Notes:</strong> {pet?.notes || 'N/A'}</p>
                              </div>
                              {pet?.profile_image && (
                                <img
                                  src={pet.profile_image}
                                  alt={`${pet.name}'s photo`}
                                  className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                                  onClick={() => {
                                    setSelectedImage(pet?.profile_image);
                                    setImageModalOpen(true);
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        {bookingPets.length === 0 && <p>No pets linked to this booking.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full overflow-y-hidden">
                    <PawLoading />
                  </div>
                )}
              </div>
            </div>
            {bookingDetails && (
              <div className="border-t p-4 bg-white mt-auto">
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
                    <div className="flex flex-col gap-2">
                      <span className="text-right text-xs items-center justify-center text-red-600">Cancelling this service will refund the furkredits to the pet owner.</span>
                      <div className="flex gap-2 justify-end items-center">
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
                      </div>
                    </div>
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
        </ResizableRightSidebar>
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

    </div>
  );
};

export default BookingDetails;
