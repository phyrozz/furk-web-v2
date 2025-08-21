import React, { useEffect, useState } from 'react';
import ResizableRightSidebar from '../../common/ResizableRightSidebar';
import { Wallet } from 'lucide-react';
import Button from '../../common/Button';
import Select from '../../common/Select';
import { http } from '../../../utils/http';
import { UserWallet } from '../../../models/user-wallet';
import { useNavigate } from 'react-router';

interface TopUpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TopUpResponseData {
  checkoutId: string;
  redirectUrl: string;
}

const TopUpSidebar: React.FC<TopUpSidebarProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{ id: string; label: string } | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    if (!amount) {
      setLoading(false);
      return;
    }

    try {
      const response = await http.post<{ success: boolean, message: string, data: TopUpResponseData }>('/pet-owner-profile/top-up', {
        amount
      });

      if (response?.success) {
        onSuccess();
        setSelectedPaymentMethod(null);
        setAmount(null);
        setError(null);
        setLoading(false);
        window.location.href = response.data.redirectUrl;
      }
    } catch (error: any) {
      setError(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAmountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow integers
    if (/^\d*$/.test(value) || value === '') {
      setAmount(value === '' ? null : parseInt(value));
    }
  }

  return (
    <ResizableRightSidebar
      isOpen={isOpen}
      onClose={onClose}
      title="Top Up Furkredits"
      icon={<Wallet className="text-primary" />}
      initialWidth={450}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-6">
          <div className="text-gray-600">
            Add funds to your account balance
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Amount</label>
              <input
                type="number"
                placeholder="Enter amount"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border-gray-300"
                value={amount ?? ''}
                min={10}
                max={1000000}
                step={10}
                onChange={(e) => onAmountInputChange(e)}
              />
            </div>

            {/* <div className="flex flex-col gap-2">
              <label className="font-medium">Payment Method</label>
              <Select
                options={[
                  { id: 'credit_card', label: 'Credit Card' },
                  { id: 'bank_transfer', label: 'Bank Transfer' },
                  { id: 'crypto', label: 'GCash' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'maya', label: 'Maya' }
                ]}
                value={selectedPaymentMethod}
                onChange={(value) => setSelectedPaymentMethod(value)}
                getOptionLabel={(option) => option.label}
                placeholder="Select payment method"
                className="w-full"
              />
            </div> */}
          </div>
        </div>

        <div className="space-y-4 mt-auto flex flex-col justify-end items-end text-end">
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          <Button variant="primary" onClick={async () => {await handleSubmit()}} loading={loading}>
            Proceed to Payment
          </Button>

          <div className="text-sm text-gray-500">
            Note: Minimum top up amount is PHP 10. Funds will be available in your account immediately after successful payment.
          </div>
          <div className="text-sm text-gray-500">
            You will be redirected to our secure payment gateway.
          </div>
        </div>
      </div>
    </ResizableRightSidebar>
  );
};

export default TopUpSidebar;
