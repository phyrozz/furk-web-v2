import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface MerchantListProps {
  selectedMerchant: any;
  onSelectMerchant: (merchant: any) => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ selectedMerchant, onSelectMerchant }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

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
              filter === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilter('approved')}
          >
            Approved
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
        {/* Sample merchant item - replace with actual data */}
        <motion.button
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            selectedMerchant?.id === 1 ? 'bg-primary-50' : ''
          }`}
          onClick={() => onSelectMerchant({ id: 1, name: 'Sample Merchant' })}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <h3 className="font-medium text-gray-900">Sample Pet Shop</h3>
          <p className="text-sm text-gray-500">Submitted on: Jan 1, 2024</p>
          <span className="inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Pending Review
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default MerchantList;