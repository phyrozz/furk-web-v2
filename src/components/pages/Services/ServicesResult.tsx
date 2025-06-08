import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import { Link } from 'react-router-dom';
import PawLoading from '../../common/PawLoading';

interface Service {
  id: number;
  name: string;
  description: string;
  service_category_name: string;
  price: number;
  business_name: string;
  merchant_type: string;
  email: string;
  phone_number: string;
  attachments: string[];
  long: number,
  lat: number,
  distance_meters: number,
  average_rating: number
}

interface ServicesResultProps {
  keyword: string;
}

const ServicesResult: React.FC<ServicesResultProps> = ({ keyword }) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const petServicesService = new PetServicesService();
  const [coords, setCoords] = useState<{ longitude: number, latitude: number} | null>(null);
  const [finishedLocationPrompt, setFinishedLocationPrompt] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const fetchServices = useCallback(
    async (limit: number, offset: number, searchKeyword: string) => {
      if (!coords) return [];
      
      try {
        const response = await petServicesService.listServices(
          limit,
          offset,
          searchKeyword,
          coords.longitude,
          coords.latitude
        );
        
        if (!response || !response.data) {
          setError(true);
          return [];
        }
        
        return response.data;
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(true);
        return [];
      }
    },
    [coords, petServicesService]
  );

  // Get location first
  useEffect(() => {
    window.scrollTo(0, 0);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          setFinishedLocationPrompt(true);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setFinishedLocationPrompt(true);
          setCoords({ latitude: 0, longitude: 0 });
        }
      );
    } else {
      setFinishedLocationPrompt(true);
      setCoords({ latitude: 0, longitude: 0 });
    }
  }, []);

  const { items: services, loadMore, loading, hasMore } = useLazyLoad<Service>({
    fetchData: fetchServices,
    limit: 10,
    keyword,
    dependencies: [coords]
  });

  useEffect(() => {
    if (!coords || error) return;

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
  }, [loadMore, hasMore, coords, error]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  if (error) {
    return (
      <div className="text-center text-gray-600 mt-24">
        <p className="text-xl font-semibold">Hmm... something went wrong</p>
        <p className="mt-2">Please try again later</p>
      </div>
    );
  }

  return (
    <>
    {finishedLocationPrompt && coords && <div className="py-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {services.map((service) => (
          <motion.div
            key={service.id}
            variants={itemVariants}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <Link to={`/services/${service.id}`}>
              <div className="relative h-48">
                <img
                  src={service.attachments[0]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white text-xl font-semibold">{service.name}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <MapPin size={16} className="mr-1" />
                    <span>{service.distance_meters.toFixed(2)} KM</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-gray-700">{service.average_rating.toFixed(1)}</span>
                  </div>
                  <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mt-3">
                    {service.service_category_name}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div ref={observerTarget} className="mt-8 text-center">
        {loading && (
          <div className="w-full h-full flex justify-center items-center">
            <PawLoading />
          </div>
        )}
      </div>

      {!hasMore && services.length > 0 && (
        <p className="text-center text-gray-600 mt-8">No more services to load</p>
      )}

      {!hasMore && services.length === 0 && (
        <div className="text-center text-gray-600 mt-8">
          <p className="text-xl font-semibold">No services found</p>
          <p className="mt-2">Try adjusting your search criteria</p>
        </div>
      )}
    </div>}
    </>
  );
};

export default ServicesResult;