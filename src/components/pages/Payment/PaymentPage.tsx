import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../utils/http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { accountWallet } from '../../../services/account-summary/account-summary';

interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    status?: string;
    message?: string;
  };
}

const failedStatuses = new Set(['PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_CANCELLED']);

const PaymentPage: React.FC = () => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [message, setMessage] = useState('Confirming your payment with Maya...');
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const paymentId = searchParams.get('payment_id') || searchParams.get('id');

  useEffect(() => {
    if (!paymentId) {
      setPaymentStatus('failed');
      setMessage('We could not find the payment reference. Please contact support.');
      return;
    }

    let active = true;
    let polling = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (status: 'success' | 'failed', nextRoute: string) => {
      if (!active) return;
      active = false;
      setPaymentStatus(status);
      if (intervalId) clearInterval(intervalId);
      redirectTimer = setTimeout(() => navigate(nextRoute), 1800);
    };

    const pollPaymentStatus = async () => {
      if (!active || polling) return;
      polling = true;

      try {
        const response = await http.post<PaymentStatusResponse>(
          `/payment/${encodeURIComponent(paymentId)}`
        );
        if (!active) return;

        const status = response.data?.status;
        if (status === 'success' || status === 'PAYMENT_SUCCESS') {
          accountWallet.invalidate();
          setMessage('Your payment was confirmed and your wallet has been updated.');
          toast.success('Payment successful!');
          finish('success', '/payment/success');
        } else if (status && failedStatuses.has(status)) {
          setMessage('Maya could not complete this payment.');
          toast.error('Payment failed.');
          finish('failed', '/payment/failed');
        } else {
          setPaymentStatus('pending');
          setMessage('Maya is still confirming your payment...');
        }
      } catch {
        if (active) {
          setPaymentStatus('pending');
          setMessage('We are still checking your payment. Please keep this page open.');
        }
      } finally {
        polling = false;
      }
    };

    const intervalId = setInterval(() => void pollPaymentStatus(), 3000);
    void pollPaymentStatus();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [paymentId, navigate]);

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'text-primary-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-primary-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Status
          </h2>
          <p className={`mt-2 text-center text-sm ${getStatusColor()}`}>
            {message}
          </p>
          {paymentStatus === 'pending' && (
            <p className="mt-2 text-center text-sm text-gray-500 font-medium">
              Please keep this page open while your payment is being confirmed.
            </p>
          )}
        </div>
        {paymentStatus === 'pending' && (
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {paymentStatus === 'success' && (
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">Payment confirmed!</p>
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">Payment Failed</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default PaymentPage;
