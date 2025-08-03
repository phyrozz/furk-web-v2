import { useEffect, useState } from "react";
import { http } from "../../../../utils/http";
import PawLoading from "../../../common/PawLoading";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import DateUtils from "../../../../utils/date-utils";

interface BookingHistoryData {
  booking_id: number;
  affiliate_id: number;
  booking: {
    id: number;
    status: string;
    booking_datetime: string;
    start_datetime: string;
    end_datetime: string;
    created_at: string;
    modified_at: string;
  };
  merchant: {
    id: number;
    business_name: string;
  },
  service: {
    id: number;
    name: string;
    description: string;
  }
}

interface BookingHistoryResponse {
  data: BookingHistoryData[];
  count: number;
}

interface BookingHistoryListProps {
  limit?: number;
  refreshTrigger?: number;
}

const BookingHistoryList: React.FC<BookingHistoryListProps> = ({
  limit = 10,
  refreshTrigger = 0,
}) => {
  const [bookings, setBookings] = useState<BookingHistoryData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const fetchBookings = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * limit;

      const response = await http.post<BookingHistoryResponse>('/affiliate/dashboard/list-bookings', {
        limit,
        offset,
        sort_order: sortOrder
      });

      setBookings(response.data);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err?.message || 'Failed to load booking history');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage);
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
    fetchBookings(currentPage);
  };

  if (isLoading && bookings.length === 0) {
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
        <h3 className="text-lg font-semibold text-gray-800">Booking History</h3>
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

      {bookings.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <p>No booking history found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.booking_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.service.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.merchant.business_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.booking.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.booking.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.booking.booking_datetime ? DateUtils.formatTimestampString(booking.booking.booking_datetime) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.booking.start_datetime ? DateUtils.formatTimestampString(booking.booking.start_datetime) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.booking.end_datetime ? DateUtils.formatTimestampString(booking.booking.end_datetime) : '-'}
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
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{bookings.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {isLoading && bookings.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-40 flex items-center justify-center">
          <PawLoading />
        </div>
      )}
    </motion.div>
  );
};

export default BookingHistoryList;