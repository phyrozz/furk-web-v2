import { useEffect, useRef } from 'react';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';
import { MerchantDetailsService } from '../../../../services/merchant-details/merchant-details';
import { Link } from 'react-router-dom';
import PawLoading from '../../../common/PawLoading';

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
  const observerTarget = useRef(null);
  const merchantService = new MerchantDetailsService();

  const { items: services, loading, hasMore } = useLazyLoad<Service>({
    fetchData: (limit, offset, keyword) => 
      merchantService.listServicesByMerchant(offset, limit, merchantId, keyword)
        .then(response => response.data),
    limit: 9,
    dependencies: [merchantId]
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

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
      <div ref={observerTarget} className="h-4" />
    </div>
  );
};

export default ServicesList;

function loadMore() {
  throw new Error('Function not implemented.');
}
