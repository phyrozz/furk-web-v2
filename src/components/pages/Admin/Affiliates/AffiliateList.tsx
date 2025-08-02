import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AffiliateApplication } from '../types';
import { useDebounce } from 'use-debounce';
import { http } from '../../../../utils/http';


interface AffiliateListProps {
  selectedAffiliate: AffiliateApplication | null;
  onSelectAffiliate: (affiliate: AffiliateApplication | null) => void;
  onAffiliateStatusChange?: () => void;
}

const AffiliateList: React.FC<AffiliateListProps> = ({ selectedAffiliate, onSelectAffiliate, onAffiliateStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState('pending');
  const [affiliates, setaffiliates] = useState<AffiliateApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchaffiliates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.post<{ data: AffiliateApplication[] }>(`/affiliate-application/list`, {
        limit: 20,
        offset: 0,
        search: debouncedSearchTerm,
        status: filter
      });
      
      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }
      
      // Server should already filter by status, but we'll double-check
      const filteredaffiliates = response.data.filter(
        (affiliate: AffiliateApplication) => affiliate.application_status === filter
      );
      
      setaffiliates(filteredaffiliates);
      
      // If the currently selected affiliate is in the list, update its data
      if (selectedAffiliate) {
        const updatedAffiliate = filteredaffiliates.find((m: any) => m.id === selectedAffiliate.id);
        if (updatedAffiliate && updatedAffiliate.application_status !== selectedAffiliate.application_status) {
          onSelectAffiliate(updatedAffiliate);
          if (onAffiliateStatusChange) {
            onAffiliateStatusChange();
          }
        }
      }
    } catch (err: any) {
      setError('Failed to fetch affiliate applications: ' + (err.message || 'Unknown error'));
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filter, selectedAffiliate, onSelectAffiliate, onAffiliateStatusChange]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetchaffiliates();
  }, [fetchaffiliates, refreshKey]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search affiliates..."
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
        
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'verified'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('verified')}
          >
            Verified
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* affiliate List */}
      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto relative">
        {loading && (
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
        ) : affiliates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No affiliate applications found
          </div>
        ) : (
          affiliates.map((affiliate) => (
            <button
              key={affiliate.id}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedAffiliate?.id === affiliate.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectAffiliate(affiliate)}
            >
              <h3 className="font-medium text-gray-900">{affiliate.first_name} {affiliate.last_name}</h3>
              <p className="text-sm text-gray-500">
                Submitted on: {new Date(affiliate.created_at).toLocaleDateString()}
              </p>
              <span
                className={`inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full ${
                  affiliate.application_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : affiliate.application_status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {affiliate.application_status.charAt(0).toUpperCase() + affiliate.application_status.slice(1)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default AffiliateList;