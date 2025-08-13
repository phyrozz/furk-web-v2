import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Promo } from '../../../../models/promo';
import { useDebounce } from 'use-debounce';

interface PromoListProps {
  selectedPromo: Promo | null;
  onSelectPromo: (promo: Promo | null) => void;
  onPromoStatusChange?: () => void;
}

const PromoList: React.FC<PromoListProps> = ({ selectedPromo, onSelectPromo, onPromoStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Dummy data for development
      const dummyPromos = [
        {
          id: 1,
          name: "Summer Sale",
          code: "SUMMER2024",
          created_at: "2024-03-01T00:00:00Z",
          discount_amount: 20,
          expiry_date: "2024-08-31T23:59:59Z"
        },
        {
          id: 2,
          name: "Welcome Discount",
          code: "WELCOME10",
          created_at: "2024-02-15T00:00:00Z", 
          discount_amount: 10,
          expiry_date: "2024-12-31T23:59:59Z"
        },
        {
          id: 3,
          name: "Flash Sale",
          code: "FLASH50",
          created_at: "2024-03-10T00:00:00Z",
          discount_amount: 50,
          expiry_date: "2024-03-12T23:59:59Z"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter promos based on search term
      const filteredPromos = dummyPromos.filter(promo => 
        promo.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        promo.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      
      setPromos(filteredPromos);
      
      if (selectedPromo) {
        const updatedPromo = filteredPromos.find(p => p.id === selectedPromo.id);
        if (updatedPromo) {
          onSelectPromo(updatedPromo);
          if (onPromoStatusChange) {
            onPromoStatusChange();
          }
        }
      }
    } catch (err: any) {
      setError('Failed to fetch promos: ' + (err.message || 'Unknown error'));
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedPromo, onSelectPromo, onPromoStatusChange]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos, refreshKey]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search promos..."
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
      </div>

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
        ) : promos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No promos found
          </div>
        ) : (
          promos.map((promo) => (
            <button
              key={promo.id}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedPromo?.id === promo.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectPromo(promo)}
            >
              <h3 className="font-medium text-gray-900">{promo.name}</h3>
              <p className="text-sm text-gray-500">
                Code: {promo.code}
              </p>
              <p className="text-sm text-gray-500">
                Created: {new Date(promo.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Discount: {promo.discount_amount}%
              </p>
              <p className="text-sm text-gray-500">
                Expires: {new Date(promo.expiry_date).toLocaleDateString()}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PromoList;
