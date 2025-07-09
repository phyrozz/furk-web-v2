import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PetServicesService } from "../../../services/pet-services/pet-services";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import PawLoading from "../../common/PawLoading";

interface RecommendedService {
  id: number;
  name: string;
  description: string;
  service_category_name: string;
  price: number;
  merchant_id: number;
  business_name: string;
  merchant_type: string;
  email: string;
  phone_number: string;
  distance_meters: number;
  average_rating: number;
  booking_count: number;
  attachment: string;
}

interface RecommendedServicesListProps {
  serviceId: number;
}

export interface RecommendedServicesListRef {
  reset: () => void;
}

const RecommendedServicesList = forwardRef<RecommendedServicesListRef, RecommendedServicesListProps>(({ serviceId }, ref) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<boolean>(false);
  const petServicesService = new PetServicesService();

  const fetchRecommendedServices = useCallback(
    async (limit: number, offset: number) => {
      try {
        const response = await petServicesService.listRecommendations(
          limit,
          offset,
          serviceId
        );
        
        if (!response || !response.data) {
          setError(true);
          return [];
        }
        
        return response.data;
      } catch (err) {
        console.error('Error fetching recommended services:', err);
        setError(true);
        return [];
      }
    },
    [petServicesService, serviceId]
  );

  const { items: recommendedServices, loadMore, loading, hasMore, reset } = useLazyLoad<RecommendedService>({
    fetchData: fetchRecommendedServices,
    limit: 10,
    keyword: ''
  });

  useImperativeHandle(ref, () => ({
    reset
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !error) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error-600">Failed to load recommended services</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendedServices.map((service) => (
          <a href={`/services/${service.id}`} key={service.id}>
            <div 
              className="bg-white rounded-lg shadow-sm p-4 transition-shadow hover:shadow-md cursor-pointer"
            >
              <div className="relative w-full h-36">
                <img 
                  src={service.attachment} 
                  alt={service.name}
                  className="absolute inset-0 w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg'; // Add a placeholder image path
                  }}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
                <p className="font-semibold text-primary-600">₱{service.price.toFixed(2)}</p>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Rating: {service.average_rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}

        {loading && (
          <div className="col-span-full flex justify-center py-4">
            <PawLoading />
          </div>
        )}

        {!loading && recommendedServices.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No similar services available</p>
          </div>
        )}

        <div ref={observerTarget} className="h-4 col-span-full" />
      </div>
    </div>
  );
});

export default RecommendedServicesList;
