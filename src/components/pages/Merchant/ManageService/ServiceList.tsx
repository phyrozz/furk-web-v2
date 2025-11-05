import { useState, useCallback, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Service } from './types';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface ServiceListProps {
  selectedService: Service | null;
  onSelectService: (service: Service | null) => void;
  onServiceStatusChange?: () => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ selectedService, onSelectService, onServiceStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 10;

  const fetchServices = async (limit: number, offset: number) => {
    try {
      setError(null);
      const response = await http.post<{ data: Service[] }>('/merchant-service/list', {
        limit,
        offset,
        keyword: debouncedSearchTerm,
        status: filter
      });
      
      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }
      
      return response.data;
    } catch (err: any) {
      setError('Failed to fetch services: ' + (err.message || 'Unknown error'));
      console.error('Error fetching services:', err);
      return [];
    }
  };

  const { items: services, loading, hasMore, loadMore, reset } = useLazyLoad<Service>({
    fetchData: fetchServices,
    limit,
    dependencies: [debouncedSearchTerm, filter, refreshKey],
  });

  const observer = useRef<IntersectionObserver>();
  const lastServiceElementRef = useCallback((node: HTMLButtonElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    reset();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Service List */}
      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative">
        {error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : services.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No services found
          </div>
        ) : (
          services.map((service, index) => (
            <button
              key={service.id}
              ref={index === services.length - 1 ? lastServiceElementRef : undefined}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedService?.id === service.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectService(service)}
            >
              <div className="flex items-start gap-3">
                {/* Show first image from attachments if available */}
                {service.attachments?.[0] && (
                  <img
                    src={service.attachments[0]}
                    alt={service.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
                  <div className="text-sm text-gray-600">
                    {service.service_category_name || 'No category'}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <span className="font-medium text-gray-900">
                    ₱{service.price?.toLocaleString()}
                  </span>
                  {service.furkredit_price != null && (
                    <div className="text-xs text-gray-500">
                      {service.furkredit_price.toLocaleString()} furkredit
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
        
        {loading && (
          <div className="p-4 text-center">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceList;