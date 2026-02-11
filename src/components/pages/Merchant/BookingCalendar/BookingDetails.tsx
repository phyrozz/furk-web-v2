import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import Button from '../../../common/Button';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import PawLoading from '../../../common/PawLoading';
import Badge from '../../../common/Badge';
import { Camera, QrCode, X } from 'lucide-react';
import Modal from '../../../common/Modal';
import ResizableRightSidebar from '../../../common/ResizableRightSidebar';
import { ToastService } from '../../../../services/toast/toast-service';

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
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanProcessing, setScanProcessing] = useState<boolean>(false);
  const [manualQrToken, setManualQrToken] = useState<string>('');
  const [scannerError, setScannerError] = useState<string>('');

  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const bookingsService = new MerchantBookingsService();

  const stopScanner = () => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

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

  const extractQrToken = (rawValue: string) => {
    const trimmed = (rawValue || '').trim();
    if (!trimmed) {
      return '';
    }

    const prefix = 'FURK_PET_QR:';
    if (trimmed.startsWith(prefix)) {
      return trimmed.substring(prefix.length);
    }

    return trimmed;
  };

  const confirmByQrToken = async (rawValue: string) => {
    if (!bookingId) return;

    const qrToken = extractQrToken(rawValue);
    if (!qrToken) {
      setScannerError('Invalid QR data');
      return;
    }

    try {
      setScanLoading(true);
      await bookingsService.scanConfirmBooking(bookingId, qrToken);
      const updatedBooking = await bookingsService.getBookingDetails(bookingId);
      setBookingDetails(updatedBooking.data);
      ToastService.show('Booking confirmed via QR scan');
      onUpdate();
      stopScanner();
      setScanModalOpen(false);
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error confirming booking via QR';
      setScannerError(message);
      ToastService.show(message);
    } finally {
      setScanLoading(false);
      setScanProcessing(false);
    }
  };

  const startScanner = async () => {
    try {
      setScannerError('');
      setScanProcessing(false);
      setManualQrToken('');
      stopScanner();

      if (!scannerVideoRef.current) {
        setScannerError('Scanner video element is not ready yet.');
        return;
      }

      const qrReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200,
      });

      scannerControlsRef.current = await qrReader.decodeFromVideoDevice(
        undefined,
        scannerVideoRef.current,
        async (result, error) => {
          if (scanProcessing) return;

          if (result?.getText()) {
            setScanProcessing(true);
            await confirmByQrToken(result.getText());
          } else if (error && !scanProcessing) {
            // Ignore "not found" frames while camera is scanning.
          }
        }
      );
    } catch {
      setScannerError('Unable to access camera. Please allow camera permissions or use manual token input.');
    }
  };

  useEffect(() => {
    if (scanModalOpen) {
      startScanner();
    } else {
      stopScanner();
      setScannerError('');
      setManualQrToken('');
    }
  }, [scanModalOpen]);

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
                    <>
                      <Button
                        variant="outline"
                        icon={<Camera size={18} />}
                        disabled={dataLoading}
                        onClick={() => setScanModalOpen(true)}
                      >
                        Scan Owner QR
                      </Button>
                      <Button
                        loading={confirmLoading}
                        disabled={dataLoading}
                        onClick={() => initiateAction('confirm')}
                      >
                        Confirm Booking
                      </Button>
                    </>
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

      <Modal
        isOpen={scanModalOpen}
        onClose={() => {
          stopScanner();
          setScanModalOpen(false);
          setScannerError('');
          setManualQrToken('');
        }}
        title="Scan Pet Owner QR"
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
            <video ref={scannerVideoRef} className="w-full h-64 object-cover" muted playsInline />
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <QrCode size={16} />
            Scan the owner's QR code. If camera scan is unsupported, paste the token below.
          </p>
          {scannerError && (
            <p className="text-sm text-red-600">{scannerError}</p>
          )}
          <input
            type="text"
            value={manualQrToken}
            onChange={(e) => setManualQrToken(e.target.value)}
            placeholder="Paste QR token or payload"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex justify-end">
            <Button
              loading={scanLoading}
              disabled={!manualQrToken.trim()}
              onClick={() => confirmByQrToken(manualQrToken)}
            >
              Confirm via Token
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetails;
