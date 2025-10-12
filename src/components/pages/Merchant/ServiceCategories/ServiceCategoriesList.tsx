import { useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';
import { ServiceCategory } from '../../../../models/service-category';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface ServiceCategoriesListProps {
  selectedCategory: ServiceCategory | null;
  onSelectCategory: (category: ServiceCategory | null) => void;
  onAddCategory: () => void;
  refreshTrigger: number;
}

const PAGE_SIZE = 6;

const ServiceCategoriesList: React.FC<ServiceCategoriesListProps> = ({ 
  selectedCategory, 
  onSelectCategory, 
  onAddCategory, 
  refreshTrigger 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedCategoryId = selectedCategory?.id ?? null;

  const fetchCategories = async (limit: number, offset: number) => {
    try {
      setError(null);
      const response = await http.post<{ data: ServiceCategory[] }>('/service-categories/list', {
        limit,
        offset,
        keyword: debouncedSearchTerm
      });
      return response.data;
    } catch (err: any) {
      setError('Failed to fetch service categories: ' + (err.message || 'Unknown error'));
      console.error('Error fetching service categories:', err);
      return [];
    }
  };

  const { items: categories, loading, hasMore, loadMore, reset } = useLazyLoad<ServiceCategory>({
    fetchData: fetchCategories,
    limit: PAGE_SIZE,
    dependencies: [debouncedSearchTerm, refreshTrigger],
  });

  const observer = useRef<IntersectionObserver>();
  const lastCategoryRef = useCallback((node: HTMLButtonElement) => {
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
    reset();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Service Categories</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your service categories
        </p>
      </div>

      <div className="p-4 border-b flex items-center justify-between">
        <div className="relative flex-1 mr-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-500"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onAddCategory}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-500"
            disabled={loading}
            title="Add new category"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative">
        {loading && categories.length === 0 && (
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
        ) : categories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No categories found</div>
        ) : (
          categories.map((category, index) => (
            <button
              key={category.id}
              ref={index === categories.length - 1 ? lastCategoryRef : undefined}
              className={`w-full p-6 text-left hover:bg-gray-50 transition-colors group ${
                selectedCategoryId === category.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectCategory(category)}
            >
              <div className="flex flex-col gap-1 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors break-words max-w-[600px] truncate">
                  {category.name}
                </h3>
                <span className="inline-flex items-center text-sm font-medium text-gray-600 truncate max-w-[200px]">
                  Service Group: {category.service_group_name}
                </span>
              </div>
            </button>
          ))
        )}

        {loading && categories.length > 0 && (
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

export default ServiceCategoriesList;