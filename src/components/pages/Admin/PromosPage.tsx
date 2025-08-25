import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminNavbar from '../../common/AdminNavbar';
import { Promo } from '../../../models/promo';
import PromoList from './Promos/PromoList';
import PromoDetails from './Promos/PromoDetails';
import AddPromoForm from './Promos/AddPromo';

const PromosPage = () => {
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddPromo = () => {
    setSelectedPromo(null);
    setIsCreating(true);
  };

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-6 pt-24 select-none">
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
                  onAddPromo={handleAddPromo}
                  refreshTrigger={refreshTrigger}
                />
              </div>

              {/* Promo Details */}
              <div className="lg:col-span-8">
                {isCreating ? (
                  <AddPromoForm
                    onSuccess={() => {
                      setIsCreating(false);
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    onCancel={() => setIsCreating(false)}
                  />
                ) : selectedPromo ? (
                  <PromoDetails promo={selectedPromo} />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select a promo to view details
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

export default PromosPage;
