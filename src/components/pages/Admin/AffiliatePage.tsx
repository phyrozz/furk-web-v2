import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import AdminNavbar from '../../common/AdminNavbar';
import { AffiliateApplication } from './types';
import { ToastService } from '../../../services/toast/toast-service';
import AffiliateList from './Affiliates/AffiliateList';
import AffiliateDetails from './Affiliates/AffiliateDetails';

const AffiliatePage = () => {
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateApplication | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleMerchantStatusChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    
    // Show a toast notification
    if (selectedAffiliate) {
      const statusText = selectedAffiliate.application_status === 'verified' ? 'approved' : 'rejected';
      ToastService.show(`Affiliate ${statusText} successfully`);
    }
    
    setSelectedAffiliate(null);
  }, [selectedAffiliate]);

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Affiliate List */}
              <div className="lg:col-span-4">
                <AffiliateList
                  selectedAffiliate={selectedAffiliate}
                  onSelectAffiliate={setSelectedAffiliate}
                  onAffiliateStatusChange={handleMerchantStatusChange}
                  key={refreshTrigger} // Force re-render when refreshTrigger changes
                />
              </div>

              {/* Affiliate Details */}
              <div className="lg:col-span-8">
                {selectedAffiliate ? (
                  <AffiliateDetails 
                    affiliate={selectedAffiliate} 
                    onStatusChange={handleMerchantStatusChange}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select an affiliate to view details
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AffiliatePage;
