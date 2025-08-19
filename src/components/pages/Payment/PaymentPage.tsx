import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../utils/http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const PaymentPage: React.FC = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [message, setMessage] = useState<string>('Processing your payment...');

  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');

  const pendingStatuses = ['PENDING_TOKEN', 'PENDING_PAYMENT', 'FOR_AUTHENTICATION', 'AUTHENTICATING', 'AUTH_SUCCESS', 'PAYMENT_PROCESSING']

  useEffect(() => {
    const pollPaymentStatus = async () => {
      try {
        const response = await http.post<{
          success: boolean;
          message: string;
          error?: string;
          status?: string;
        }>(`/payment/${id}`); 

        console.log("error message", response);

        if (!response.success && response.error && pendingStatuses.includes(response.error)) {
          // Payment is still processing, keep the pending status
          setMessage(response.message || 'Payment is still processing...');
          setPaymentStatus('pending');
          return;
        }

        if (response.status || response.error === 'Payment already processed') {
          setPaymentStatus('success');
        }

        if (response.message) {
          setMessage(response.message);
        }

        if (response.status === 'success') {
          toast.success('Payment successful!');
          // Redirect to a success page or dashboard after a short delay
          setTimeout(() => navigate('/payment/success'), 3000);
        } else if (response.error && response.error === 'PAYMENT_FAILED') {
          toast.error(`Payment failed: ${response.message || 'Please try again.'}`);
          // Optionally redirect to an error page or allow retry
          setTimeout(() => navigate('/payment/failed'), 3000);
        }
      } catch (error: any) {
        console.error('Error polling payment status:', error);

        const errorMessage = error?.response?.data?.error;
        console.log("Error message: ", errorMessage);

        if (errorMessage && errorMessage === 'Payment already processed') {
          setPaymentStatus('success');
          setTimeout(() => navigate('/payment/success'), 3000);
        } else {
          setPaymentStatus('failed');
          setMessage(`Payment processing error: ${error.message || 'Please try again later.'}`);
          toast.error(`Payment processing error: ${error.message || 'Please try again later.'}`);
          setTimeout(() => navigate('/payment/failed'), 3000);
        }        
      }
    };

    const intervalId = setInterval(() => {
      if (paymentStatus === 'pending') {
        pollPaymentStatus();
      }
    }, 1000); // Poll every 5 seconds

    // Initial poll
    pollPaymentStatus();

    return () => clearInterval(intervalId);
  }, [paymentStatus, navigate, id]);

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'successful':
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
            <p className="mt-2 text-lg font-medium text-gray-900">Payment Completed Successfully!</p>
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