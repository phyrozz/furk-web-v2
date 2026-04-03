import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { QrCode } from 'lucide-react';
import Modal from '../../../common/Modal';
import Button from '../../../common/Button';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import { ToastService } from '../../../../services/toast/toast-service';

interface QrScanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: (bookingId: number) => void;
}

const QrScanConfirmModal: React.FC<QrScanConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmed,
}) => {
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

  const extractQrToken = (rawValue: string) => {
    const trimmed = (rawValue || '').trim();
    if (!trimmed) return '';

    const prefixes = ['FURK_PET_QR:', 'FURK_PET_OWNER_QR:'];
    for (const prefix of prefixes) {
      if (trimmed.startsWith(prefix)) {
        return trimmed.substring(prefix.length);
      }
    }

    return trimmed;
  };

  const confirmByQrToken = async (rawValue: string) => {
    const qrToken = extractQrToken(rawValue);
    if (!qrToken) {
      setScannerError('Invalid QR data');
      return;
    }

    try {
      setScanLoading(true);
      const response: any = await bookingsService.scanConfirmByQr(qrToken);
      const confirmedBookingId = Number(response?.data?.id);
      ToastService.show(`Booking #${confirmedBookingId} confirmed via QR scan`);
      onConfirmed(confirmedBookingId);
      stopScanner();
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
            // Ignore frames where no QR is found.
          }
        }
      );
    } catch {
      setScannerError('Unable to access camera. Please allow camera permissions or use manual token input.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setScannerError('');
      setManualQrToken('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScanner();
        setScannerError('');
        setManualQrToken('');
        onClose();
      }}
      title="Scan Booking QR"
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
          <video ref={scannerVideoRef} className="w-full h-64 object-cover" muted playsInline />
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <QrCode size={16} />
          Scan either the pet QR or pet owner QR, depending on the service requirement.
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
  );
};

export default QrScanConfirmModal;
