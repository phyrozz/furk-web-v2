import { useState, useImperativeHandle, forwardRef, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, User, Wallet, Dog, ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';
import { http } from '../../../../utils/http';
import PawLoading from '../../../common/PawLoading';
import Button from '../../../common/Button';
import DateUtils from '../../../../utils/date-utils';
import ResizableRightSidebar from '../../../common/ResizableRightSidebar';
import { capitalizeWords } from '../../../../utils/string-utils';
import { useDebounce } from 'use-debounce';

interface PetOwner {
  id: string;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
  furkredits_balance: number;
  furkoins_balance: number;
  reward_tier_name: string;
  pet_count: number;
  total_transactions: number;
  total_spent: number;
}

interface PetOwnerDetails {
  id: string;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string;
  created_at: string;
  modified_at: string;
  is_active: boolean;
  furkredits_balance: number;
  furkoins_balance: number;
  reward_tier_name: string;
  pet_count: number;
  total_transactions: number;
  total_spent: number;
}

interface PetDetails {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birth_date: string | null;
  weight_kg: number | null;
  color: string | null;
  is_neutered: boolean;
  notes: string | null;
  profile_image: string | null;
  created_at: string;
  modified_at: string;
}

interface AdminTransaction {
  id: string;
  booking_id: number | null;
  currency_type: string;
  amount: number;
  transaction_type: string;
  created_at: string;
  modified_at: string;
  maya_reference_number: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
  fund_source_type: string | null;
}

export interface PetOwnersWidgetRef {
  refetch: () => void;
}

const PetOwnersWidget = forwardRef<PetOwnersWidgetRef>((props, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedOwner, setSelectedOwner] = useState<PetOwner | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<PetOwnerDetails | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('joined');
  const [sortOrder, setSortOrder] = useState('DESC');

  const fetchPetOwners = async (limit: number, offset: number, keyword: string) => {
    try {
      const response: any = await http.post('/admin-dashboard/list-users', {
        limit,
        offset,
        keyword,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching pet owners:', error);
      return [];
    }
  };

  const fetchPets = useCallback(
    async (limit: number, offset: number) => {
      if (!selectedOwner) return [];
      try {
        const response: any = await http.post(
          `/admin-dashboard/users/${selectedOwner.id}/pets`,
          {
            limit,
            offset,
          }
        );
        return response.data || [];
      } catch (error) {
        console.error('Error fetching pets:', error);
        return [];
      }
    },
    [selectedOwner]
  );

  const fetchTransactions = useCallback(
    async (limit: number, offset: number) => {
      if (!selectedOwner) return [];
      try {
        const response: any = await http.post(
          `/admin-dashboard/users/${selectedOwner.id}/transactions`,
          {
            limit,
            offset,
          }
        );
        return response.data || [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
    [selectedOwner]
  );

  const { items: petOwners, loadMore, loading, hasMore, reset } = useLazyLoad<PetOwner>({
    fetchData: fetchPetOwners,
    limit: 10,
    keyword: debouncedSearchTerm,
    dependencies: [sortBy, sortOrder],
  });

  const {
    items: pets,
    loadMore: loadMorePets,
    loading: petsLoading,
    hasMore: petsHasMore,
  } = useLazyLoad<PetDetails>({
    fetchData: fetchPets,
    limit: 5,
    enabled: !!selectedOwner,
    dependencies: [selectedOwner?.id],
  });

  const {
    items: transactions,
    loadMore: loadMoreTransactions,
    loading: transactionsLoading,
    hasMore: transactionsHasMore,
  } = useLazyLoad<AdminTransaction>({
    fetchData: fetchTransactions,
    limit: 10,
    enabled: !!selectedOwner,
    dependencies: [selectedOwner?.id],
  });

  const observerTarget = useRef(null);
  const petsLoadMoreRef = useRef(null);
  const transactionsLoadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const petsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && petsHasMore && !petsLoading) {
          loadMorePets();
        }
      },
      { threshold: 0.1 }
    );

    if (petsLoadMoreRef.current) {
      petsObserver.observe(petsLoadMoreRef.current);
    }

    return () => {
      if (petsLoadMoreRef.current) {
        petsObserver.unobserve(petsLoadMoreRef.current);
      }
    };
  }, [petsHasMore, petsLoading, loadMorePets]);

  useEffect(() => {
    if (!transactionsHasMore || transactionsLoading) return;

    const transactionsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTransactions();
        }
      },
      { threshold: 0.5, rootMargin: '100px' }
    );

    const currentRef = transactionsLoadMoreRef.current;
    if (currentRef) {
      transactionsObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        transactionsObserver.unobserve(currentRef);
      }
    };
  }, [transactionsHasMore, transactionsLoading, loadMoreTransactions]);

  useImperativeHandle(ref, () => ({
    refetch: () => reset(),
  }));

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setOwnerDetails(null);
  };

  const getFullName = (owner: { first_name: string; middle_name: string | null; last_name: string }) => {
    return `${owner.first_name} ${owner.middle_name ? owner.middle_name + ' ' : ''}${owner.last_name}`;
  };

  const formatFurkAmount = (amount: number, currencyType: string) => {
    const absAmount = Math.abs(amount);
    if (currencyType === 'furkredits') {
      return absAmount % 1 === 0 ? absAmount.toString() : absAmount.toFixed(2);
    }
    return Math.abs(Math.round(absAmount)).toString();
  };

  const handleSelectOwner = async (owner: PetOwner) => {
    setSelectedOwner(owner);
    setIsSidebarOpen(true);
    setDetailsLoading(true);
    try {
      const response: any = await http.get(`/admin-dashboard/users/${owner.id}`);
      const data = response.data || {};
      setOwnerDetails(data.user || null);
    } catch (error) {
      console.error('Error fetching pet owner details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pet Owners</h3>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search pet owners..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            {/* <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'inactive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </button>
            </div> */}
          </div>
        </div>

        {loading && petOwners.length === 0 ? (
          <div className="flex justify-center py-8">
            <PawLoading />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('fullname')}
                    >
                      <div className="flex items-center gap-1">
                        User
                        {sortBy === 'fullname' && (
                          sortOrder === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center gap-1">
                        Username
                        {sortBy === 'username' && (
                          sortOrder === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('pets')}
                    >
                      <div className="flex items-center gap-1">
                        Pets
                        {sortBy === 'pets' && (
                          sortOrder === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                      </div>
                    </th>
                    {/* <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Wallet
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Activity
                    </th> */}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('joined')}
                    >
                      <div className="flex items-center gap-1">
                        Joined
                        {sortBy === 'joined' && (
                          sortOrder === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {petOwners.map((owner, index) => (
                    <motion.tr
                      key={owner.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectOwner(owner)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(owner)}
                            </div>
                            <div className="text-xs text-gray-500">{owner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {owner.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {owner.pet_count}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>FK: {formatFurkAmount(owner.furkredits_balance, 'furkredits')}</span>
                          <span>FC: {formatFurkAmount(owner.furkoins_balance, 'furkoins')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{owner.total_transactions} transactions</span>
                          <span>Total spent: {formatFurkAmount(owner.total_spent, 'furkredits')}</span>
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {DateUtils.formatTimestampString(owner.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-primary-600">
                        View details
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && petOwners.length > 0 && (
              <div ref={observerTarget} className="mt-4 flex justify-center py-4 h-12">
                {loading && <PawLoading />}
              </div>
            )}

            {!hasMore && petOwners.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                All pet owners loaded
              </p>
            )}

            {!loading && petOwners.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No pet owners found</p>
              </div>
            )}

            {petOwners.length > 0 && !loading && petOwners.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No pet owners match the selected filters.</p>
              </div>
            )}
          </>
        )}
      </div>

      <ResizableRightSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        title={
          ownerDetails
            ? getFullName(ownerDetails)
            : selectedOwner
            ? getFullName(selectedOwner)
            : 'Pet Owner Details'
        }
        icon={<User className="h-6 w-6 text-primary-600" />}
        initialWidth={480}
      >
        {detailsLoading && !ownerDetails ? (
          <div className="w-full h-full flex items-center justify-center">
            <PawLoading />
          </div>
        ) : !ownerDetails && !selectedOwner ? (
          <div className="text-center text-gray-500 py-8">
            Select a pet owner to view details.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSidebar}
                icon={<X className="h-4 w-4" />}
              >
                Close
              </Button>
            </div>
            {/* Profile */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {ownerDetails ? getFullName(ownerDetails) : selectedOwner ? getFullName(selectedOwner) : ''}
                </div>
                <div className="text-sm text-gray-500">{ownerDetails?.email || selectedOwner?.email}</div>
                <div className="text-sm text-gray-500">
                  {ownerDetails?.phone_number || selectedOwner?.phone_number || 'No phone number'}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Joined {DateUtils.formatTimestampString(ownerDetails?.created_at || selectedOwner?.created_at || '')}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-xs text-gray-500">
                  Reward tier: {ownerDetails?.reward_tier_name || selectedOwner?.reward_tier_name}
                </div>
              </div>
            </div>

            {/* Wallet + engagement summary */}
            {ownerDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wallet Card */}
                <div className="border rounded-lg p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary-50">
                    <Wallet className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800 mb-2">Wallet</div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-700">
                        Furkredits:{' '}
                        <span className="font-semibold">
                          {formatFurkAmount(ownerDetails.furkredits_balance, 'furkredits')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        Furkoins:{' '}
                        <span className="font-semibold">
                          {formatFurkAmount(ownerDetails.furkoins_balance, 'furkoins')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Card */}
                <div className="border rounded-lg p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-50">
                    <Dog className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800 mb-2">Engagement</div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-700">
                        Pets:{' '}
                        <span className="font-semibold">{ownerDetails.pet_count}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        Transactions:{' '}
                        <span className="font-semibold">{ownerDetails.total_transactions}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        Total spent:{' '}
                        <span className="font-semibold">
                          {formatFurkAmount(ownerDetails.total_spent, 'furkredits')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pets with profile images */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex itemscenter gap-2">
                  <Dog className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Pets</h3>
                </div>
              </div>
              {pets.length > 0 && (
                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex gap-3 border rounded-lg p-3 items-center"
                    >
                      {pet.profile_image ? (
                        <img
                          src={pet.profile_image}
                          alt={pet.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {pet.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pet.species} • {pet.breed}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Added {DateUtils.formatTimestampString(pet.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {petsHasMore && (
                    <div ref={petsLoadMoreRef} className="py-2 flex justify-center h-8 w-full">
                      {petsLoading && <PawLoading size={36} />}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Transaction History</h3>
                </div>
              </div>
              {transactions.length === 0 && !transactionsLoading ? (
                <div className="text-sm text-gray-500">
                  No transactions found for this owner.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {transactions.map((transaction) => {
                    const isCredit = transaction.amount > 0;
                    const isFurkredits = transaction.currency_type === 'furkredits';

                    return (
                      <div
                        key={transaction.id}
                        className={`border rounded-lg p-3 text-xs ${
                          isCredit ? 'border-green-200' : 'border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`rounded-full p-1 ${
                                isCredit ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDown
                                  className={`h-4 w-4 ${
                                    isCredit ? 'text-green-600' : 'text-red-600'
                                  }`}
                                />
                              ) : (
                                <ArrowUp
                                  className={`h-4 w-4 ${
                                    isCredit ? 'text-green-600' : 'text-red-600'
                                  }`}
                                />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {transaction.transaction_type === 'refund'
                                  ? 'Refund'
                                  : isCredit
                                  ? isFurkredits
                                    ? 'Top Up'
                                    : 'Received'
                                  : 'Spent'}{' '}
                                <span
                                  className={
                                    isCredit ? 'text-green-600' : 'text-red-600'
                                  }
                                >
                                  {formatFurkAmount(
                                    transaction.amount,
                                    transaction.currency_type
                                  )}
                                </span>{' '}
                                {isFurkredits ? 'Furkredits' : 'Furkoins'}
                              </div>
                              <div className="mt-1 text-gray-500">
                                {DateUtils.formatTimestampString(
                                  transaction.created_at
                                )}
                              </div>
                              {transaction.fund_source_type && (
                                <div className="mt-1 text-gray-400">
                                  Paid via{' '}
                                  {capitalizeWords(
                                    transaction.fund_source_type
                                  )}
                                </div>
                              )}
                              {transaction.maya_reference_number && (
                                <div className="mt-1 text-gray-400">
                                  Maya Ref:{' '}
                                  {transaction.maya_reference_number}
                                </div>
                              )}
                              {transaction.provider_status && (
                                <div className="mt-1 text-gray-400">
                                  Status: {transaction.provider_status}
                                </div>
                              )}
                            </div>
                          </div>
                          {transaction.booking_id && (
                            <div className="text-right text-gray-400">
                              Booking #{transaction.booking_id}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {transactionsHasMore && (
                    <div ref={transactionsLoadMoreRef} className="py-2 flex justify-center h-8 w-full">
                      {transactionsLoading && <PawLoading size={36} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ResizableRightSidebar>
    </>
  );
});

PetOwnersWidget.displayName = 'PetOwnersWidget';

export default PetOwnersWidget;
