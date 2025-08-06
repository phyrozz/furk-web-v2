import { useEffect, useRef, useState } from 'react';
import { MerchantDetailsService } from '../../../../services/merchant-details/merchant-details';
import { Link } from 'react-router-dom';
import PawLoading from '../../../common/PawLoading';
import Button from '../../../common/Button';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  service_category_id: number;
  service_category_name: string;
  service_category_description: string;
  overall_rating: number;
  attachments: string[];
}

interface ServicesListProps {
  merchantId: string;
}

const ServicesList = ({ merchantId }: ServicesListProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 9;

  const merchantService = new MerchantDetailsService();

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await merchantService.listServicesByMerchant(offset, limit, merchantId, '');
      const newServices = response.data;
      
      if (newServices.length < limit) {
        setHasMore(false);
      }
      
      setServices(offset === 0 ? newServices : prev => [...prev, ...newServices]);
      setOffset(offset === 0 ? limit : prev => prev + limit);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Services Offered</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Link
            to={`/services/${service.id}`}
            key={service.id}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            {service.attachments && service.attachments[0] && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={service.attachments[0]} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary-600 font-semibold">₱{service.price.toLocaleString()}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-accent-500">★</span>
                  <span className="text-sm text-gray-600">{service.overall_rating.toFixed(1)}</span>
                </div>
              </div>
              <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mt-3">
                {service.service_category_name}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {loading && (
        <div className="flex justify-center py-4">
          <PawLoading />
        </div>
      )}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button onClick={loadMore} variant="ghost">See More</Button>
        </div>
      )}
    </div>
  );
};

export default ServicesList;
