import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { AdminDashboardService } from '../../../services/admin/admin-dashboard-service';
import { MerchantApplication } from './types';


interface MerchantListProps {
  selectedMerchant: MerchantApplication | null;
  onSelectMerchant: (merchant: MerchantApplication | null) => void;
}

const adminDashboardService = new AdminDashboardService();

const MerchantList: React.FC<MerchantListProps> = ({ selectedMerchant, onSelectMerchant }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');
  const [merchants, setMerchants] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminDashboardService.listServices(10, 0, searchTerm, filter);
      const filteredMerchants = response.data.filter(
        (merchant: MerchantApplication) => merchant.status === filter
      );
      setMerchants(filteredMerchants);
    } catch (err) {
      setError('Failed to fetch merchant applications');
      console.error('Error fetching merchants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [searchTerm, filter]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-4 border-b">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search merchants..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
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

      {/* Merchant List */}
      <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : merchants.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No merchant applications found
          </div>
        ) : (
          merchants.map((merchant) => (
            <motion.button
              key={merchant.id}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedMerchant?.id === merchant.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelectMerchant(merchant)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
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
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
              </span>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default MerchantList;