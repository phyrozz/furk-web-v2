import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';
import { Promo } from '../../../../models/promo';

interface PromoListProps {
  selectedPromo: Promo | null;
  onSelectPromo: (promo: Promo | null) => void;
  onPromoStatusChange?: () => void;
  onAddPromo: () => void;
}

const PAGE_SIZE = 10;

const PromoList: React.FC<PromoListProps> = ({ selectedPromo, onSelectPromo, onAddPromo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPromoRef = useRef<HTMLButtonElement | null>(null);

  const selectedPromoId = selectedPromo?.id ?? null;

  const fetchPromos = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await http.post<{ data: Promo[] }>('/coupon/list', {
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
        keyword: debouncedSearchTerm
      });

      const newPromos = response.data;

      setPromos(prev => (pageNum === 1 ? newPromos : [...prev, ...newPromos]));
      // Consider there is more only if we got a full page
      setHasMore(newPromos.length === PAGE_SIZE);
    } catch (err: any) {
      setError('Failed to fetch promos: ' + (err.message || 'Unknown error'));
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  const handleRefresh = () => {
    setPromos([]);
    setPage(1);
    setHasMore(true);
    fetchPromos(1);
  };

  // Fetch when page changes
  useEffect(() => {
    if (!hasMore && page > 1) return; // prevent looping if no more data
    fetchPromos(page);
  }, [page, debouncedSearchTerm]);

  // Reset when search term changes (new query = new list)
  useEffect(() => {
    setPromos([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearchTerm]);

  // Keep selected promo in sync with the latest list data
  useEffect(() => {
    if (!selectedPromoId) return;
    const updated = promos.find(p => p.id === selectedPromoId);
    if (updated) {
      // Only update if the object actually differs (prevents unnecessary parent state churn)
      const changed =
        selectedPromo == null ||
        updated !== selectedPromo; // shallow identity check is enough here
      if (changed) onSelectPromo(updated);
    }
  }, [promos, selectedPromoId, onSelectPromo, selectedPromo]);

  // Setup observer once
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      {
        root: listContainerRef.current ?? null, // observe within the scroll container
        threshold: 0.5
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading]);

  // Observe the current last item whenever the list changes
  useEffect(() => {
    const node = lastPromoRef.current;
    const obs = observerRef.current;
    if (node && obs) {
      obs.observe(node);
      return () => obs.unobserve(node);
    }
  }, [promos]); // re-attach when items change

  const getDiscountLabel = (discountValue: number, type: string) => {
    switch (type) {
      case 'percent':
        return `${discountValue}%`;
      case 'fixed':
        return `${discountValue} Furkredits`;
      case 'credits':
        return `+${discountValue} Furkredits`;
      case 'points':
        return `${discountValue} Furkoins`;
      default:
        return discountValue;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4 gap-1">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search promos..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // restart pagination when searching
                setPromos([]);
                setHasMore(true);
                setPage(1);
              }}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-500"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onAddPromo}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-500"
            disabled={loading}
            title="Refresh list"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div
        ref={listContainerRef}
        className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative"
      >
        {loading && page === 1 && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </div>
        )}

        {error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : promos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No promos found</div>
        ) : (
          promos.map((promo, index) => (
            <button
              key={promo.id}
              ref={index === promos.length - 1 ? lastPromoRef : null}
              className={`w-full p-6 text-left hover:bg-gray-50 transition-colors group ${
                selectedPromoId === promo.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectPromo(promo)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                  {promo.description}
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {promo.code}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Discount:</span>
                  <span className="text-sm font-medium">
                    {getDiscountLabel(promo.discount_value, promo.discount_type)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Usage:</span>
                  <span>{promo.used_count}/{promo.usage_limit}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Created:</span>
                  <span>{new Date(promo.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Expires:</span>
                  <span>{new Date(promo.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))
        )}

        {loading && page > 1 && (
          <div className="p-4 text-center">
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoList;
