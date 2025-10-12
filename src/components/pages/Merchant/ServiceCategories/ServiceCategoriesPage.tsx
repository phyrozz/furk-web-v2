import { useState } from 'react';
import { motion } from 'framer-motion';
import { ServiceCategory } from '../../../../models/service-category';
import ServiceCategoriesList from './ServiceCategoriesList';
import AddServiceCategoryForm from './AddServiceCategory';
import ServiceCategoryDetails from './ServiceCategoryDetails';
import MerchantNavbar from '../../../common/MerchantNavbar';

const ServiceCategoriesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCreating(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24 select-none">
      <MerchantNavbar />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
            <p className="text-gray-600">Manage your service categories for your business</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category List */}
            <div className="lg:col-span-4">
              <ServiceCategoriesList
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onAddCategory={handleAddCategory}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* Category Details */}
            <div className="lg:col-span-8">
              {isCreating ? (
                <AddServiceCategoryForm
                  onSuccess={() => {
                    setIsCreating(false);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  onCancel={() => setIsCreating(false)}
                />
              ) : selectedCategory ? (
                <ServiceCategoryDetails
                  category={selectedCategory}
                  onUpdated={(updatedCategory) => {
                    setSelectedCategory(updatedCategory);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  onDeleted={() => {
                    setSelectedCategory(null);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Select a category to view details or click "+" to add a new one
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceCategoriesPage;