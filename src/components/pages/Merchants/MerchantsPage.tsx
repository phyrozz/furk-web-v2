import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Rating } from 'react-simple-star-rating';
import PawLoading from '../../common/PawLoading';
import Button from '../../common/Button';
import Select from '../../common/Select';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import { MerchantsService } from '../../../services/merchants/merchants';

interface Merchant {
  id: number;
  business_name: string;
  merchant_type: string;
  exterior_photo?: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  distance_meters: number;
  average_rating: number;
  rating_count: number;
  booking_count: number;
  service_count: number;
}

type SortBy = 'booking_count' | 'average_rating';
type SortOption = {
  label: string;
  value: SortBy;
  order: 'ASC' | 'DESC';
};

const sortOptions: SortOption[] = [
  { label: 'Nearest + Popularity', value: 'booking_count', order: 'DESC' as const },
  { label: 'Nearest + Rating', value: 'average_rating', order: 'DESC' as const }
];

const MerchantsPage = () => {
  const merchantService = useMemo(() => new MerchantsService(), []);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywordInput, setKeywordInput] = useState(searchParams.get('search') || '');
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<SortBy>(
    searchParams.get('sortBy') === 'average_rating' ? 'average_rating' : 'booking_count'
  );
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(
    (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  );
  const [maxDistanceKm, setMaxDistanceKm] = useState(searchParams.get('maxDistanceKm') || '');
  const [coords, setCoords] = useState<{ longitude: number; latitude: number } | null>(null);
  const [finishedLocationPrompt, setFinishedLocationPrompt] = useState(false);
  const [error, setError] = useState(false);

  const fetchMerchants = useCallback(
    async (limit: number, offset: number, searchKeyword: string) => {
      if (!coords) return [];

      try {
        const maxDistanceMeters =
          maxDistanceKm.trim() !== '' && !Number.isNaN(Number(maxDistanceKm))
            ? Number(maxDistanceKm) * 1000
            : null;

        const response = await merchantService.listMerchants({
          limit,
          offset,
          keyword: searchKeyword,
          longitude: coords.longitude,
          latitude: coords.latitude,
          sortBy,
          sortOrder,
          maxDistanceMeters
        });

        if (!response || !response.data) {
          setError(true);
          return [];
        }

        return response.data as Merchant[];
      } catch (err) {
        console.error('Error fetching merchants:', err);
        setError(true);
        return [];
      }
    },
    [coords, maxDistanceKm, merchantService, sortBy, sortOrder]
  );

  const { items: merchants, loadMore, loading, hasMore } = useLazyLoad<Merchant>({
    fetchData: fetchMerchants,
    limit: 12,
    keyword,
    dependencies: [coords, sortBy, sortOrder, maxDistanceKm]
  });

  useEffect(() => {
    document.title = 'Merchants - FURK';
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('search', keyword);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    if (maxDistanceKm.trim() !== '') params.set('maxDistanceKm', maxDistanceKm);
    setSearchParams(params);
  }, [keyword, sortBy, sortOrder, maxDistanceKm, setSearchParams]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setFinishedLocationPrompt(true);
        },
        () => {
          setCoords({ latitude: 0, longitude: 0 });
          setFinishedLocationPrompt(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setCoords({ latitude: 0, longitude: 0 });
      setFinishedLocationPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (!coords || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [coords, error, hasMore, loadMore]);

  if (error) {
    return (
      <div className="pt-28 pb-16 container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center text-gray-600 mt-24">
          <p className="text-xl font-semibold">Unable to load merchants</p>
          <p className="mt-2">Please try again in a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 select-none">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Find Merchants</h1>
          <p className="text-sm text-gray-600 mt-1">Search merchants and sort by popularity, rating, or distance.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <div className="flex gap-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setKeyword(keywordInput.trim());
                    }
                  }}
                  placeholder="Search by merchant, city, or service..."
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <Button
                  variant="primary"
                  onClick={() => setKeyword(keywordInput.trim())}
                >
                  Search
                </Button>
              </div>
            </div>

            <Select
              options={sortOptions}
              value={sortOptions.find((option) => option.value === sortBy && option.order === sortOrder) || null}
              onChange={(option) => {
                if (!option) return;
                setSortBy(option.value);
                setSortOrder(option.order);
              }}
              getOptionLabel={(option) => `Sort by ${option.label}`}
              className="w-full"
            />

            <input
              type="number"
              min={0}
              step={0.5}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
              placeholder="Max distance (km)"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {finishedLocationPrompt && coords && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {merchants.map((merchant) => (
              <Link
                to={`/merchants/${merchant.id}`}
                key={merchant.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-full h-40 mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={merchant.exterior_photo || '/logo_new_small.png'}
                    alt={merchant.business_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex justify-between items-start gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{merchant.business_name}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800 whitespace-nowrap">
                    {merchant.merchant_type}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {merchant.address}, {merchant.barangay}, {merchant.city}, {merchant.province}
                </p>

                <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-primary-600" />
                    <span>{(merchant.distance_meters / 1000).toFixed(2)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-primary-600" />
                    <span>{merchant.booking_count} bookings</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-800">{merchant.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({merchant.rating_count})</span>
                  </div>
                  <Rating
                    initialValue={merchant.average_rating}
                    size={14}
                    allowFraction={true}
                    allowHover={false}
                    SVGstyle={{ display: 'inline' }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-3">{merchant.service_count} active services</p>
              </Link>
            ))}
          </motion.div>
        )}

        <div ref={observerTarget} className="mt-8 text-center">
          {loading && (
            <div className="w-full h-full flex justify-center items-center">
              <PawLoading />
            </div>
          )}
        </div>

        {!loading && merchants.length === 0 && finishedLocationPrompt && (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-xl font-semibold">No merchants found</p>
            <p className="mt-2">Try changing your search or filters.</p>
          </div>
        )}

        {!hasMore && merchants.length > 0 && (
          <p className="text-center text-gray-600 mt-8">No more merchants to load</p>
        )}
      </div>
    </div>
  );
};

export default MerchantsPage;
