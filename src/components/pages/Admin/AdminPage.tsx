import { useState } from 'react';
import MerchantList from './MerchantList';
import MerchantDetails from './MerchantDetails';
import { motion } from 'framer-motion';
import AdminNavbar from '../../common/AdminNavbar';
import { MerchantApplication } from './types';

const AdminPage = () => {
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantApplication | null>(null);

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
                />
              </div>

              {/* Merchant Details */}
              <div className="lg:col-span-8">
                {selectedMerchant ? (
                  <MerchantDetails merchant={selectedMerchant} />
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