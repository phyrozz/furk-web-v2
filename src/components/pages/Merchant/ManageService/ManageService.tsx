import { useState, useEffect } from 'react';
import { Trash2, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManageServicesService } from '../../../../services/manage-services/manage-services-service';
import { ToastService } from '../../../../services/toast/toast-service';
import Button from '../../../common/Button';
import Loading from '../../../common/Loading';
import MerchantNavbar from '../../../common/MerchantNavbar';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

const ManageService = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const navigate = useNavigate();
  const serviceApi = new ManageServicesService();

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await serviceApi.listServices(limit, offset, keyword);
      setServices(response.data || []);
    } catch (error) {
      ToastService.show('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    document.title = 'Manage Services - FURK';
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, [keyword, offset]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setOffset(0); // Reset offset when searching
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Are you sure you want to delete ${service.name}?`)) {
      return;
    }

    try {
      await serviceApi.deleteService({ id: service.id });
      ToastService.show('Service deleted successfully');
      loadServices(); // Reload the list
    } catch (error) {
      ToastService.show('Failed to delete service');
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <MerchantNavbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              className="text-gray-600"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
          </div>
          <Button
            onClick={() => navigate('/merchant/add-service')}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Service
          </Button>
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
        {loading ? (
          <Loading text="Loading services..." />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {services.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">
                          ₱{service.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">{service.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(service)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No services found. Add your first service to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageService;