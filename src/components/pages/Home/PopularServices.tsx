import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HomeService, PopularService } from '../../../services/home/home-service';
import PawLoading from '../../common/PawLoading';
import { useNavigate } from 'react-router-dom';

const homeService = new HomeService();

const PopularServices = () => {
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        setLoading(true);
        const data = await homeService.listPopularServices();
        setPopularServices(data.data);
      } catch (err) {
        setError('Failed to fetch popular services.');
        console.error('Error fetching popular services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularServices();
  }, []);

  useEffect(() => {
    if (!loading && !isScrollPaused && !reachedEnd && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scroll = () => {
        container.scrollTo({
          left: container.scrollLeft + 1,
          behavior: 'smooth'
        });
        
        const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 2;
        if (isAtEnd) {
          setReachedEnd(true);
        }
        
        setScrollPosition(container.scrollLeft / (container.scrollWidth - container.clientWidth));
      };

      const intervalId = setInterval(scroll, 50);
      return () => clearInterval(intervalId);
    }
  }, [loading, isScrollPaused, reachedEnd]);

  if (loading) {
    return <div className="w-full h-96 flex justify-center items-center">
      <PawLoading />
    </div>;
  }

  if (error) {
    return <div></div>;
  }

  return (
    popularServices.length >= 8 && (<section className="py-8 md:py-12 bg-gray-50">
      <motion.div 
        className="container mx-auto px-4 md:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <h2 className="font-cursive text-3xl font-bold md:text-3xl text-center mb-4">Popular Services</h2>
        <p className="text-xl text-gray-600 text-center mb-8 max-w-2xl mx-auto">
          Discover our most sought-after pet care services
        </p>
        <div className="relative w-full">
          <motion.div 
            className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: scrollPosition < 0.001 ? 0 : 1 }}
          />
          <motion.div 
            className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: scrollPosition > 0.999 ? 0 : 1 }}
          />
          <div 
            ref={scrollContainerRef}
            onMouseEnter={() => setIsScrollPaused(true)}
            onMouseLeave={() => setIsScrollPaused(false)}
            onTouchStart={() => setIsScrollPaused(true)}
            onTouchEnd={() => setIsScrollPaused(false)}
            onScroll={(e) => {
              const container = e.currentTarget;
              setScrollPosition(container.scrollLeft / (container.scrollWidth - container.clientWidth));
            }}
            className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide relative w-full"
          >
            {popularServices.length > 0 ? (
              popularServices.map((service) => (
                <div className="py-2 px-1">
                  <motion.div 
                    key={service.id} 
                    className="flex-none w-80 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <img src={service.attachment} alt={service.name} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 truncate">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 truncate">{service.business_name}</p>
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="text-yellow-500 mr-1">★</span> {service.avg_rating.toFixed(1)} ({service.total_reviews} reviews)
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="text-center w-full py-4 text-gray-600">No popular services found.</div>
            )}
          </div>
        </div>
      </motion.div>
    </section>)
  );
};

export default PopularServices;