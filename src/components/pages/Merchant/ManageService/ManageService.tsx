import { useState } from 'react';
import { Trash2, Search, Plus, ChevronDown, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManageServicesService } from '../../../../services/manage-services/manage-services-service';
import { ToastService } from '../../../../services/toast/toast-service';
import Button from '../../../common/Button';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  attachments: string[];
}

const ManageService = () => {
  const [keyword, setKeyword] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const navigate = useNavigate();
  const serviceApi = new ManageServicesService();
  const {
    items: services,
    loadMore,
    loading,
    hasMore,
    reset
  } = useLazyLoad<Service>({
    fetchData: (limit, offset, keyword) =>
      serviceApi.listServices(limit, offset, keyword).then((res) => res.data || []),
    keyword,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Are you sure you want to delete ${service.name}?`)) {
      return;
    }

    try {
      await serviceApi.deleteService({ id: service.id });
      ToastService.show('Service deleted successfully');
      reset();
    } catch (error) {
      ToastService.show('Failed to delete service');
    }
  };

  const toggleExpand = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      loadMore();
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex flex-col h-screen overflow-y-hidden">
      <MerchantNavbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col container mx-auto px-4 md:px-6 lg:px-8 py-8 overflow-y-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              className="text-gray-600 gap-2"
            >
              <ArrowLeft size={20} /> 
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => navigate('/merchant/add-service')}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Add New Service
            </Button>
            <Button
              onClick={() => reset()}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={20} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={keyword}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Services List */}
        <motion.div
          onScroll={handleScroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-white rounded-lg shadow overflow-y-auto relative"
        >
          {services.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                  layout
                >
                  <motion.div
                    className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpand(service.id)}
                    whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                        <motion.div
                          initial={false}
                          animate={{ rotate: expandedService === service.id ? 180 : 0 }}
                        >
                          <ChevronDown className="text-gray-400" size={20} />
                        </motion.div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">
                          ₱{service.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">{service.category}</span>
                      </div>
                    </div>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service);
                      }}
                      className="p-2 ml-4 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedService === service.id && service.attachments && service.attachments.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="px-4 pb-4 bg-gray-50 overflow-hidden"
                      >
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {service.attachments.map((attachment, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-200"
                            >
                              <img
                                src={attachment}
                                alt={`${service.name} attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            !loading && (
              <motion.div className="p-4 text-center text-gray-500">
                No services found. Add your first service to get started!
              </motion.div>
            )
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ManageService;