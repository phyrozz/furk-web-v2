import { useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';
import { RewardProduct } from '../../../../models/reward-product';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface RewardProductListProps {
  selectedRewardProduct: RewardProduct | null;
  onSelectRewardProduct: (promo: RewardProduct | null) => void;
  onRewardProductStatusChange?: () => void;
  onAddRewardProduct: () => void;
  refreshTrigger: number;
}

const PAGE_SIZE = 50;

const RewardProductList: React.FC<RewardProductListProps> = ({ selectedRewardProduct, onSelectRewardProduct, onRewardProductStatusChange, onAddRewardProduct, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedRewardProductId = selectedRewardProduct?.id ?? null;

  const fetchRewardProducts = async (limit: number, offset: number) => {
    try {
      setError(null);
      const response = await http.post<{ data: RewardProduct[] }>('/admin-reward-products/list', {
        limit,
        offset,
        keyword: debouncedSearchTerm
      });
      return response.data;
    } catch (err: any) {
      setError('Failed to fetch reward products: ' + (err.message || 'Unknown error'));
      console.error('Error fetching reward products:', err);
      return [];
    }
  };

  const { items: rewardProducts, loading, hasMore, loadMore, reset } = useLazyLoad<RewardProduct>({
    fetchData: fetchRewardProducts,
    limit: PAGE_SIZE,
    dependencies: [debouncedSearchTerm, refreshTrigger],
  });

  const observer = useRef<IntersectionObserver>();
  const lastRewardProductRef = useCallback((node: HTMLButtonElement) => {
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

  // Update selected reward product if its data changes
  useCallback(() => {
    if (selectedRewardProductId) {
      const updated = rewardProducts.find(p => p.id === selectedRewardProductId);
      if (updated && updated !== selectedRewardProduct) {
        onSelectRewardProduct(updated);
        if (onRewardProductStatusChange) {
          onRewardProductStatusChange();
        }
      }
    }
  }, [rewardProducts, selectedRewardProductId, onSelectRewardProduct, selectedRewardProduct, onRewardProductStatusChange]);

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
                reset();
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

      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative">
        {loading && rewardProducts.length === 0 && (
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
              ref={index === rewardProducts.length - 1 ? lastRewardProductRef : undefined}
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

        {loading && rewardProducts.length > 0 && (
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
