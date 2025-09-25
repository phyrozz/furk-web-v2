import { useState, useCallback, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdminDashboardService } from '../../../../services/admin/admin-dashboard-service';
import { MerchantApplication } from '../types';
import { useDebounce } from 'use-debounce';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface MerchantListProps {
  selectedMerchant: MerchantApplication | null;
  onSelectMerchant: (merchant: MerchantApplication | null) => void;
  onMerchantStatusChange?: () => void;
}

const adminDashboardService = new AdminDashboardService();

const MerchantList: React.FC<MerchantListProps> = ({ selectedMerchant, onSelectMerchant, onMerchantStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 50;

  const fetchMerchants = async (limit: number, offset: number) => {
    try {
      setError(null);
      const response: any = await adminDashboardService.listServices(limit, offset, debouncedSearchTerm, filter);
      
      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }
      
      // Server should already filter by status, but we'll double-check
      const filteredMerchants = response.data.filter(
        (merchant: MerchantApplication) => merchant.status === filter
      );
      
      return filteredMerchants;
    } catch (err: any) {
      setError('Failed to fetch merchant applications: ' + (err.message || 'Unknown error'));
      console.error('Error fetching merchants:', err);
      return [];
    }
  };

  const { items: merchants, loading, hasMore, loadMore, reset } = useLazyLoad<MerchantApplication>({
    fetchData: fetchMerchants,
    limit,
    dependencies: [debouncedSearchTerm, filter, refreshKey],
  });

  const observer = useRef<IntersectionObserver>();
  const lastMerchantElementRef = useCallback((node: HTMLButtonElement) => {
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

  // Update selected merchant if its status changes
  useCallback(() => {
    if (selectedMerchant) {
      const updatedMerchant = merchants.find(m => m.id === selectedMerchant.id);
      if (updatedMerchant && updatedMerchant.status !== selectedMerchant.status) {
        onSelectMerchant(updatedMerchant);
        if (onMerchantStatusChange) {
          onMerchantStatusChange();
        }
      }
    }
  }, [merchants, selectedMerchant, onSelectMerchant, onMerchantStatusChange]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search merchants..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            className={`px-3 py-1 rounded-full text-sm flex-shrink-0 ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm flex-shrink-0 ${
              filter === 'verified'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('verified')}
          >
            Approved
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm flex-shrink-0 ${
              filter === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm flex-shrink-0 ${
              filter === 'suspended'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('suspended')}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Merchant List */}
      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative">
        {error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : merchants.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No merchant applications found
          </div>
        ) : (
          merchants.map((merchant, index) => (
            <button
              key={merchant.id}
              ref={index === merchants.length - 1 ? lastMerchantElementRef : undefined}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedMerchant?.id === merchant.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectMerchant(merchant)}
            >
              <h3 className="font-medium text-gray-900">{merchant.business_name}</h3>
              <p className="text-sm text-gray-500">
                Submitted on: {new Date(merchant.created_at).toLocaleDateString()}
              </p>
              <span
                className={`inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full ${
                  merchant.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : merchant.status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : merchant.status === 'suspended'
                    ? 'bg-gray-800 text-white'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {merchant.status === 'verified' ? 'Approved' : merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
              </span>
            </button>
          ))
        )}
        
        {loading && (
          <div className="p-4 text-center">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantList;