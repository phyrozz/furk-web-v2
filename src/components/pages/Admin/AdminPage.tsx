import { useState, useCallback } from 'react';
import MerchantList from './Merchants/MerchantList';
import MerchantDetails from './Merchants/MerchantDetails';
import { motion } from 'framer-motion';
import AdminNavbar from '../../common/AdminNavbar';
import { MerchantApplication } from './types';
import { ToastService } from '../../../services/toast/toast-service';
import { useLocation } from 'react-router-dom';

const AdminPage = () => {
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantApplication | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const locationState = location.state as {
    preselectMerchantId?: number;
    prefillKeyword?: string;
    prefillStatus?: string;
  } | null;

  const preselectMerchantId = locationState?.preselectMerchantId;
  const prefillKeyword = locationState?.prefillKeyword || '';
  const prefillStatus = locationState?.prefillStatus || 'pending';
  
  const handleMerchantStatusChange = useCallback(() => {
    // Increment refresh trigger to cause the merchant list to refresh
    setRefreshTrigger(prev => prev + 1);
    
    // Show a toast notification
    if (selectedMerchant) {
      const statusText = selectedMerchant.status === 'verified' ? 'approved' : 'rejected';
      ToastService.show(`Merchant ${statusText} successfully`);
    }
    
    // Clear the selected merchant after status change
    setSelectedMerchant(null);
  }, [selectedMerchant]);

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
              {/* Merchant List */}
              <div className="lg:col-span-4">
                <MerchantList
                  selectedMerchant={selectedMerchant}
                  onSelectMerchant={setSelectedMerchant}
                  onMerchantStatusChange={handleMerchantStatusChange}
                  initialSearchTerm={prefillKeyword}
                  initialFilter={prefillStatus}
                  autoSelectMerchantId={preselectMerchantId}
                  key={refreshTrigger} // Force re-render when refreshTrigger changes
                />
              </div>

              {/* Merchant Details */}
              <div className="lg:col-span-8">
                {selectedMerchant ? (
                  <MerchantDetails 
                    merchant={selectedMerchant} 
                    onStatusChange={handleMerchantStatusChange}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select a merchant to view details
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

export default AdminPage;