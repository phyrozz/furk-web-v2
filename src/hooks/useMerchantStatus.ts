import { useEffect, useState } from 'react';
import { CheckMerchantStatusService } from '../services/check-merchant-status/check-merchant-status';

export function useMerchantStatus() {
  const [status, setStatus] = useState<'verified' | 'unverified' | 'pending' | 'rejected' | 'suspended' | null>(null);
  const [hasBusinessHours, setHasBusinessHours] = useState<boolean | null>(null);

  useEffect(() => {
    const service = new CheckMerchantStatusService();

    const fetchStatus = async () => {
      try {
        await service.setMerchantStatus();

        const localStatus = localStorage.getItem('merchantStatus');
        const localHours = localStorage.getItem('hasBusinessHours');

        if (localStatus) setStatus(localStatus as any);
        if (localHours) setHasBusinessHours(localHours === 'true');
      } catch (error) {
        console.error('Failed to set merchant status:', error);
      }
    };

    fetchStatus();
  }, []);

  return { status, hasBusinessHours };
}
