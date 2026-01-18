import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Clock, DollarSign, Filter } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';
import { AdminPayoutService, AdminPayout } from '../../../../services/admin/admin-payout-service';
import Button from '../../../common/Button';
import AdminNavbar from '../../../common/AdminNavbar';
import PawLoading from '../../../common/PawLoading';
import { motion } from 'framer-motion';
import moment from 'moment';
import { formatAmount } from '../../../../utils/currency-utils';
import { ToastService } from '../../../../services/toast/toast-service';

const AdminPayoutsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    moment().startOf('month').toDate(),
    moment().endOf('month').toDate()
  ]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingPayouts, setProcessingPayouts] = useState<Set<number>>(new Set());
  const [approvingPayouts, setApprovingPayouts] = useState<Set<number>>(new Set());

  const payoutService = new AdminPayoutService();

  const { items: payouts, loading, hasMore, loadMore, reset } = useLazyLoad<AdminPayout>({
    fetchData: (limit: number, offset: number, keyword: string) =>
      payoutService.listPayouts(limit, offset, keyword, dateRange[0], dateRange[1], statusFilter)
        .then((res: any) => res.data || []),
    keyword: debouncedSearchTerm,
    limit: 50,
    dependencies: [dateRange, statusFilter]
  });

  const handleApprove = async (payoutId: number) => {
    if (approvingPayouts.has(payoutId)) return;
    
    setApprovingPayouts(prev => new Set(prev).add(payoutId));
    try {
      await payoutService.approvePayout(payoutId);
      ToastService.show('Payout approved successfully');
      reset();
    } catch (error: any) {
      ToastService.show(`Failed to approve payout: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setApprovingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
    }
  };

  const handleProcess = async (payoutId: number) => {
    if (processingPayouts.has(payoutId)) return;
    
    if (!window.confirm('Are you sure you want to process this payout? This will send the payment via Maya API.')) {
      return;
    }
    
    setProcessingPayouts(prev => new Set(prev).add(payoutId));
    try {
      await payoutService.processPayout(payoutId);
      ToastService.show('Payout processed successfully');
      reset();
    } catch (error: any) {
      ToastService.show(`Failed to process payout: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setProcessingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
    }
  };

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Processed' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const totalAmount = payouts.reduce((sum, payout) => sum + parseFloat(payout.amount.toString()), 0);
  const pendingCount = payouts.filter(p => p.status === 'pending').length;
  const approvedCount = payouts.filter(p => p.status === 'approved').length;
  const processedCount = payouts.filter(p => p.status === 'processed').length;

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex flex-col h-screen overflow-y-hidden cursor-default">
      <AdminNavbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col container mx-auto px-4 md:px-6 lg:px-8 py-8 overflow-y-hidden"
      >
        <div className="flex sm:flex-row flex-col gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="font-bold font-cursive text-gray-900 md:text-2xl text-xl">Payout Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
              <button
                onClick={() => {
                  const newDate = moment(dateRange[0]).subtract(1, 'month').startOf('month');
                  setDateRange([newDate.toDate(), moment(newDate).endOf('month').toDate()]);
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
                  const newDate = moment(dateRange[0]).add(1, 'month').startOf('month');
                  setDateRange([newDate.toDate(), moment(newDate).endOf('month').toDate()]);
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-primary-500">₱ {formatAmount(totalAmount)}</p>
              </div>
              <DollarSign className="text-primary-500" size={32} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
              </div>
              <CheckCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{processedCount}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by service, merchant, or email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Payouts List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-white rounded-lg shadow overflow-y-auto relative"
          onScroll={handleScroll}
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
                  key={payout.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{payout.service.name}</h3>
                        {getStatusBadge(payout.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Merchant:</span> {payout.merchant.business_name}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {payout.merchant_user.email}
                        </p>
                        <p>
                          <span className="font-medium">Earning Date:</span>{' '}
                          {moment(payout.earning_date).format('MMMM D, YYYY h:mm A')}
                        </p>
                        {payout.maya_payout_id && (
                          <p>
                            <span className="font-medium">Maya Payout ID:</span> {payout.maya_payout_id}
                          </p>
                        )}
                        {payout.processed_at && (
                          <p>
                            <span className="font-medium">Processed At:</span>{' '}
                            {moment(payout.processed_at).format('MMMM D, YYYY h:mm A')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-2xl font-bold text-primary-600">
                        ₱ {formatAmount(payout.amount)}
                      </p>
                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <Button
                            onClick={() => handleApprove(payout.id)}
                            variant="primary"
                            size="sm"
                            disabled={approvingPayouts.has(payout.id)}
                            loading={approvingPayouts.has(payout.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {(payout.status === 'pending' || payout.status === 'approved') && (
                          <Button
                            onClick={() => handleProcess(payout.id)}
                            variant="primary"
                            size="sm"
                            disabled={processingPayouts.has(payout.id)}
                            loading={processingPayouts.has(payout.id)}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
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

export default AdminPayoutsPage;
