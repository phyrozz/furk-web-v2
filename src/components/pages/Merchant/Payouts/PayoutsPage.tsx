import React, { useState, useEffect } from 'react';
import { CalendarDays, DollarSign, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import Button from '../../../common/Button';
import { BookingPayouts } from '../../../../models/booking';
import MerchantNavbar from '../../../common/MerchantNavbar';
import PawLoading from '../../../common/PawLoading';
import { motion } from 'framer-motion';
import moment from 'moment';
import { formatAmount } from '../../../../utils/currency-utils';

interface PayoutsPageProps {
  
}

const PayoutsPage: React.FC<PayoutsPageProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    moment().startOf('month').add(1, 'day').toDate(),
    moment().endOf('month').toDate()
  ]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<number>(0);

  const dataService = new MerchantBookingsService();

  const { items: payouts, loading, hasMore, loadMore, reset } = useLazyLoad<BookingPayouts>({
    fetchData: (limit: number, offset: number, keyword: string) =>
      dataService.listMerchantPayouts(limit, offset, keyword, dateRange[0], dateRange[1]).then((res: any) => res.data || []),
    keyword: debouncedSearchTerm,
    limit: 50,
    dependencies: [dateRange]
  });

  useEffect(() => {
    const fetchMonthlyEarnings = async () => {
      try {
        const response = await dataService.getPayoutMonthlyEarnings(dateRange[0], dateRange[1]);
        setMonthlyEarnings(response.data.total_earning);
      } catch (error) {
        console.error('Error fetching monthly earnings:', error);
      }
    };
    fetchMonthlyEarnings();
  }, [dateRange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      loadMore();
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    reset();
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex flex-col h-screen overflow-y-hidden cursor-default">
      <MerchantNavbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col container mx-auto px-4 md:px-6 lg:px-8 py-8 overflow-y-hidden"
      >
        <div className="flex sm:flex-row flex-col gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="font-bold font-cursive text-gray-900 md:text-2xl text-xl">Payouts</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
              <button
                onClick={() => {
                  const newDate = new Date(dateRange[0]);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setDateRange([newDate, new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="mx-4 font-medium">
                {dateRange[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newDate = moment(dateRange[0]).add(1, 'month').add(1, 'day').startOf('month');
                  const endDate = moment(newDate).endOf('month');
                  setDateRange([newDate.toDate(), endDate.toDate()]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={moment().isSame(dateRange[0], 'month')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-primary-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Monthly Earnings</h2>
              </div>
              <div className="text-2xl font-bold text-primary-500">
                {formatAmount(monthlyEarnings)} Furkredits
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-white rounded-lg shadow overflow-y-auto relative"
        >
          {loading && payouts.length === 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <PawLoading />
            </div>
          )}

          {payouts.length === 0 && !loading ? (
            <div className="p-4 text-center text-gray-500 h-full w-full flex justify-center items-center">
              No payouts found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {payouts.map((payout) => (
                <motion.div
                  onScroll={handleScroll}
                  key={payout.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  layout
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{payout.service.name}</h3>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <p className="flex items-center">
                      <CalendarDays size={16} className="mr-2" />
                      Earning Date: {moment(payout.earning_date).utcOffset('+00:00').format('MMMM D, YYYY h:mm A')}
                    </p>
                    <p className="flex items-center font-bold">
                      {formatAmount(payout.amount)} Furkredits
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PayoutsPage;
