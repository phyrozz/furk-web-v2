import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminNavbar from '../../common/AdminNavbar';
import { Promo } from '../../../models/promo';
import PromoList from './Promos/PromoList';

const PromosPage = () => {
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

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
              {/* Promo List */}
              <div className="lg:col-span-4">
                <PromoList
                  selectedPromo={selectedPromo}
                  onSelectPromo={setSelectedPromo}
                />
              </div>

              {/* Promo Details */}
              {/* <div className="lg:col-span-8">
                {selectedPromo ? (
                  <PromoDetails 
                    promo={selectedPromo} 
                    onStatusChange={handlePromoStatusChange}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select a promo to view details
                  </div>
                )}
              </div> */}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PromosPage;
