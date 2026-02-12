import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeService, PopularService } from '../../../services/home/home-service';
import PawLoading from '../../common/PawLoading';

const homeService = new HomeService();

const PopularServices = () => {
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPopularServices = async () => {
      try {
        setLoading(true);
        const data = await homeService.listPopularServices();
        if (!isMounted) return;
        setPopularServices(data.data || []);
      } catch (error) {
        if (!isMounted) return;
        setHasError(true);
        console.error('Error fetching popular services:', error);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchPopularServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleArrowScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = Math.max(container.clientWidth * 0.75, 280);
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex justify-center items-center">
        <PawLoading />
      </div>
    );
  }

  if (hasError || popularServices.length === 0) {
    return null;
  }

  const ServiceCard = ({ service }: { service: PopularService }) => (
    <article
      className="w-[78vw] sm:w-[20rem] md:w-[22rem] shrink-0 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      aria-label={`${service.name} by ${service.business_name}`}
    >
      <button
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
        onClick={() => navigate(`/services/${service.id}`)}
      >
        <img
          src={service.attachment}
          alt={service.name}
          loading="lazy"
          decoding="async"
          width={640}
          height={384}
          className="w-full h-44 object-cover rounded-t-xl"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 truncate">{service.name}</h3>
          <p className="text-sm text-gray-600 mt-1 truncate">{service.business_name}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-primary-700 font-semibold truncate">
              {service.furkredit_price} <span className="text-xs text-gray-500">Furkredits</span>
            </p>
            <p className="text-sm text-gray-700 shrink-0">
              Rating {service.avg_rating.toFixed(1)} ({service.total_reviews})
            </p>
          </div>
        </div>
      </button>
    </article>
  );

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-cursive text-3xl md:text-4xl font-bold sm:text-start text-center mb-3 text-gray-900">
          Popular Services
        </h2>
        <p className="text-lg md:text-xl text-gray-600 sm:text-start text-center mb-10">
          Discover our most sought-after pet care services
        </p>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

          <button
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 border border-gray-200 p-2 shadow-sm hover:bg-white"
            onClick={() => handleArrowScroll('left')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 border border-gray-200 p-2 shadow-sm hover:bg-white"
            onClick={() => handleArrowScroll('right')}
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-4 snap-x snap-mandatory px-10">
              {popularServices.map((service) => (
                <div key={service.id} className="snap-start">
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
