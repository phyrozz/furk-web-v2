import { useState, useEffect, useRef } from 'react';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import { RewardTier, RewardTierResponse } from '../../../models/reward-tier';
import { http } from '../../../utils/http';
import { ToastService } from '../../../services/toast/toast-service';
import Button from '../../common/Button';
import { Award, Check, ChevronDown, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import PawLoading from '../../common/PawLoading';
import Modal from '../../common/Modal';

const RewardTiers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [currentTier, setCurrentTier] = useState<RewardTier | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchRewardTiers = async (limit: number, offset: number, keyword: string) => {
    try {
      const response = await http.post<RewardTierResponse>('/reward-tier/list', {
        limit,
        offset,
        keyword
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch reward tiers:', error);
      setError('Failed to load reward tiers. Please try again.');
      return [];
    }
  };

  const fetchCurrentTier = async () => {
    try {
      setLoadingCurrent(true);
      const response = await http.get<{ data: RewardTier }>('/reward-tier/get');
      setCurrentTier(response.data || null);
    } catch (error) {
      console.error('Failed to fetch current reward tier:', error);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const { items: tiers, loadMore, loading, hasMore, reset } = useLazyLoad<RewardTier>({
    fetchData: fetchRewardTiers,
    keyword: debouncedSearchTerm,
    limit: 10,
  });

  useEffect(() => {
    fetchCurrentTier();
  }, []);

  useEffect(() => {
    reset();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubscribe = async () => {
    if (!selectedTier) return;

    try {
      setSubscribing(true);
      setError(null);
      setShowConfirmModal(false);
      
      await http.post('/reward-tier/subscribe', {
        reward_tier_id: selectedTier.id
      });
      
      ToastService.show(`Successfully subscribed to ${selectedTier.name} tier!`);
      setCurrentTier(selectedTier);
      setSelectedTier(null);
      
    } catch (error: any) {
      console.error('Failed to subscribe to reward tier:', error);
      setError(error?.response?.data?.error || 'Failed to subscribe to reward tier. Please try again.');
      ToastService.show(error?.response?.data?.error || 'Failed to subscribe to reward tier');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setUnsubscribing(true);
      setError(null);
      setShowUnsubscribeModal(false);
      
      await http.post('/reward-tier/opt-out');
      
      ToastService.show('Successfully unsubscribed from reward tier!');
      setCurrentTier(null);
      
    } catch (error: any) {
      console.error('Failed to unsubscribe from reward tier:', error);
      setError(error?.response?.data?.error || 'Failed to unsubscribe from reward tier. Please try again.');
      ToastService.show(error?.response?.data?.error || 'Failed to unsubscribe from reward tier');
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      loadMore();
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto p-6">
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubscribe}
        showConfirm
        showCancel
        confirmDisabled={subscribing}
        title="Confirm Subscription"
      >
        <p>
          Are you sure you want to subscribe to <strong>{selectedTier?.name}</strong> tier?
          This will require <strong>{selectedTier?.required_furkredits}</strong> Furkredits.
        </p>
      </Modal>

      <Modal
        isOpen={showUnsubscribeModal}
        onClose={() => setShowUnsubscribeModal(false)}
        onConfirm={handleUnsubscribe}
        showConfirm
        showCancel
        confirmDisabled={unsubscribing}
        title="Confirm Unsubscription"
      >
        <p>
          Are you sure you want to unsubscribe from <strong>{currentTier?.name}</strong> tier?
          Your Furkredits will <strong>not</strong> be refunded once you unsubscribe.
        </p>
      </Modal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-cursive font-semibold text-gray-800">Reward Tiers</h2>
          <p className="text-sm text-gray-500">Subscribe to reward tiers to unlock exclusive benefits</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loadingCurrent ? (
        <div className="flex justify-center items-center p-4">
          <PawLoading size={36} />
        </div>
      ) : currentTier ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentTier.color_code || '#4F46E5' }}
            >
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{currentTier.name}</h3>
              <p className="text-sm text-gray-500">Tier {currentTier.tier_level}</p>
              <p className="text-primary-600 font-bold">{currentTier.required_furkredits} Furkredits per month</p>
            </div>
          </div>
          <p className="text-gray-700">{currentTier.description}</p>
          <div className="mt-4">
            <Button
              variant="outline"
              color="red"
              onClick={() => setShowUnsubscribeModal(true)}
              disabled={unsubscribing}
            >
              Unsubscribe
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
          You are not currently subscribed to any reward tier.
        </div>
      )}

      <div className="relative w-full" ref={dropdownRef}>
        <div 
          className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-md cursor-pointer"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center gap-2">
            {selectedTier ? (
              <>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedTier.color_code || '#4F46E5' }}
                >
                  <Award size={16} className="text-white" />
                </div>
                <span>{selectedTier.name}</span>
              </>
            ) : (
              <span className="text-gray-500">Select a reward tier</span>
            )}
          </div>
          <ChevronDown size={18} />
        </div>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md"
                  placeholder="Search tiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-2 top-3 text-gray-400" />
              </div>
            </div>
            <div 
              className="max-h-60 overflow-y-auto"
              onScroll={handleScroll}
            >
              {loading && tiers.length === 0 ? (
                <div className="flex justify-center items-center p-4">
                  <PawLoading size={36} />
                </div>
              ) : tiers.length > 0 ? (
                tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`flex items-center gap-2 p-3 hover:bg-gray-100 cursor-pointer ${
                      selectedTier?.id === tier.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedTier(tier);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tier.color_code || '#4F46E5' }}
                    >
                      <Award size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-xs text-gray-500">
                        {tier.required_furkredits} Furkredits required
                      </div>
                    </div>
                    {selectedTier?.id === tier.id && (
                      <Check size={16} className="text-primary-600" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">No reward tiers found</div>
              )}
              {loading && tiers.length > 0 && (
                <div className="flex justify-center items-center p-2">
                  <PawLoading size={36} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedTier && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedTier.color_code || '#4F46E5' }}
            >
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{selectedTier.name}</h3>
              <p className="text-sm text-gray-500">Tier {selectedTier.tier_level}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700">{selectedTier.description}</p>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-sm text-gray-500">Required Furkredits</span>
              <p className="text-lg font-semibold text-primary-600">{selectedTier.required_furkredits}</p>
            </div>
            {!selectedTier.is_active && (
              <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Inactive
              </div>
            )}
          </div>
          
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShowConfirmModal(true)}
            disabled={!selectedTier.is_active}
          >
            Subscribe to {selectedTier.name}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RewardTiers;