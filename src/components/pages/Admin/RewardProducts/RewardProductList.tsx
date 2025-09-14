import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';
import { RewardProduct } from '../../../../models/reward-product';

interface RewardProductListProps {
  selectedRewardProduct: RewardProduct | null;
  onSelectRewardProduct: (promo: RewardProduct | null) => void;
  onRewardProductStatusChange?: () => void;
  onAddRewardProduct: () => void;
  refreshTrigger: number;
}

const PAGE_SIZE = 50;

const RewardProductList: React.FC<RewardProductListProps> = ({ selectedRewardProduct, onSelectRewardProduct, onAddRewardProduct, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [rewardProducts, setRewardProducts] = useState<RewardProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRewardProductRef = useRef<HTMLButtonElement | null>(null);

  const selectedRewardProductId = selectedRewardProduct?.id ?? null;

  const fetchRewardProducts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await http.post<{ data: RewardProduct[] }>('/admin-reward-products/list', {
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
        keyword: debouncedSearchTerm
      });

      const newRewardProducts = response.data;

      setRewardProducts(prev => (pageNum === 1 ? newRewardProducts : [...prev, ...newRewardProducts]));
      setHasMore(newRewardProducts.length === PAGE_SIZE);
    } catch (err: any) {
      setError('Failed to fetch reward products: ' + (err.message || 'Unknown error'));
      console.error('Error fetching reward products:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  const handleRefresh = () => {
    setRewardProducts([]);
    setPage(1);
    setHasMore(true);
    fetchRewardProducts(1);
  };

  useEffect(() => {
    if (!hasMore && page > 1) return;
    fetchRewardProducts(page);
  }, [page, debouncedSearchTerm, refreshTrigger]);

  useEffect(() => {
    setRewardProducts([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (!selectedRewardProductId) return;
    const updated = rewardProducts.find(p => p.id === selectedRewardProductId);
    if (updated) {
      const changed =
        selectedRewardProduct == null ||
        updated !== selectedRewardProduct;
      if (changed) onSelectRewardProduct(updated);
    }
  }, [rewardProducts, selectedRewardProductId, onSelectRewardProduct, selectedRewardProduct]);

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
        root: listContainerRef.current ?? null,
        threshold: 0.5
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading]);

  useEffect(() => {
    const node = lastRewardProductRef.current;
    const obs = observerRef.current;
    if (node && obs) {
      obs.observe(node);
      return () => obs.unobserve(node);
    }
  }, [rewardProducts]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4 gap-1">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setRewardProducts([]);
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
            onClick={onAddRewardProduct}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-500"
            disabled={loading}
            title="Add new reward product"
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
        ) : rewardProducts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No products found</div>
        ) : (
          rewardProducts.map((product, index) => (
            <button
              key={product.id}
              ref={index === rewardProducts.length - 1 ? lastRewardProductRef : null}
              className={`w-full p-6 text-left hover:bg-gray-50 transition-colors group ${
                selectedRewardProductId === product.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectRewardProduct(product)}
            >
              <div className="flex flex-col gap-1 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors break-words max-w-[600px] truncate">
                  {product.product_name}
                </h3>
                <span className="inline-flex items-center text-sm font-medium text-primary-800 truncate max-w-[200px]">
                  {product.sponsor_name}
                </span>
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

export default RewardProductList;
