import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { http } from '../../../../utils/http';
import DateUtils from '../../../../utils/date-utils';
import PawLoading from '../../../common/PawLoading';
import { ApplicationStatus } from '../../../../models/application_statuses';

interface MerchantListData {
  merchant_id: number;
  username: string;
  phone_number: string;
  business_name: string;
  merchant_type: string;
  application_status: ApplicationStatus;
  joined_at: string;
}

interface MerchantListResponse {
  data: MerchantListData[];
  count: number;
}

interface MerchantListProps {
  limit?: number;
  refreshTrigger?: number;
}

const MerchantList: React.FC<MerchantListProps> = ({ limit = 10, refreshTrigger = 0 }) => {
  const [merchants, setMerchants] = useState<MerchantListData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  const fetchMerchants = async (page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      
      const response = await http.post<MerchantListResponse>('/affiliate/dashboard/list-referrals', {
        limit,
        offset,
        sort_order: sortOrder
      });
      
      setMerchants(response.data);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err?.message || 'Failed to load merchant referrals');
      setMerchants([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMerchants(currentPage);
  }, [currentPage, limit, sortOrder, refreshTrigger]);
  
  const totalPages = Math.ceil(totalCount / limit);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };
  
  const handleRefresh = () => {
    fetchMerchants(currentPage);
  };
  
  if (isLoading && merchants.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <PawLoading />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Your Merchant Referrals</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSortOrder}
            className="text-gray-600 hover:text-primary-600 transition-colors text-sm flex items-center"
          >
            Sort by Date: {sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-center">
          {error}
        </div>
      )}
      
      {merchants.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <p>No merchant referrals found.</p>
          <p className="text-sm mt-2">Share your referral link to start earning!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {merchants.map((merchant) => (
                <tr key={merchant.merchant_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{merchant.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{merchant.business_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {merchant.merchant_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {merchant.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      merchant.application_status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : merchant.application_status === 'unverified'
                        ? 'bg-yellow-100 text-yellow-800'
                        : merchant.application_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : merchant.application_status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {merchant.application_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {DateUtils.formatTimestampString(merchant.joined_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{merchants.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && merchants.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-40 flex items-center justify-center">
          <PawLoading />
        </div>
      )}
    </motion.div>
  );
};

export default MerchantList;
