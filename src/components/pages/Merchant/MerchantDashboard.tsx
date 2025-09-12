import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, Package, Plus, List } from 'lucide-react';
import TodaysSchedule from './MerchantDashboard/TodaysSchedule';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import MerchantNavbar from '../../common/MerchantNavbar';
import { MerchantDashboardService } from '../../../services/merchant-dashboard/merchant-dashboard';
import PawLoading from '../../common/PawLoading';
import { RecentActivities } from './MerchantDashboard/RecentActivities';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import { useMerchantStatus } from '../../../hooks/useMerchantStatus';

const merchantDashboardService = new MerchantDashboardService();

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface Activity {
  id: number;
  merchant_id?: number;
  service_id?: number;
  title: string;
  description?: string;
  modified_at: string;
}

interface Stats {
  total_bookings_count: number;
  pending_only_count: number;
  confirmed_only_count: number;
  completed_only_count: number;
  cancelled_only_count: number;
  monthly_earnings: number;
}

const MerchantDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    total_bookings_count: 0,
    pending_only_count: 0,
    confirmed_only_count: 0,
    completed_only_count: 0,
    cancelled_only_count: 0,
    monthly_earnings: 0
  });
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      const data: any = await merchantDashboardService.getDashboardStats();
      setStats(data.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setStatsLoading(false);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivities = useCallback(async (limit: number, offset: number) => {
    try {
      const response: any = await merchantDashboardService.getRecentActivities(limit, offset);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      return [];
    }
  }, []);

  const { items: recentActivities, loadMore, loading, hasMore, reset } = useLazyLoad<Activity>({
    fetchData: fetchRecentActivities,
    limit: 50,
    enabled: true,
  });

  const observer = useRef<IntersectionObserver>();
  const lastActivityElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  useEffect(() => {
    fetchStats();
  }, []);

  const navigate = useNavigate();
  
  const cards: DashboardCard[] = [
    {
      title: 'Total Bookings',
      value: stats.total_bookings_count,
      icon: <Package size={24} />,
      color: 'bg-primary-500',
    },
    {
      title: 'Pending Bookings',
      value: stats.pending_only_count,
      icon: <Clock size={24} />,
      color: 'bg-warning-500',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmed_only_count,
      icon: <Calendar size={24} />,
      color: 'bg-success-500',
    },
    {
      title: 'Monthly Earnings',
      value: stats.monthly_earnings,
      icon: <DollarSign size={24} />,
      color: 'bg-secondary-500',
    },
  ];


  const quickActions = [
    {
      title: 'List New Service',
      icon: <Plus size={20} />,
      onClick: () => navigate('/merchant/add-service'),
    },
    {
      title: 'Manage Services',
      icon: <List size={20} />,
      onClick: () => navigate('/merchant/manage-services'),
    },
    {
      title: 'View Bookings',
      icon: <Calendar size={20} />,
      onClick: () => navigate('/merchant/bookings'),
    },
  ];

  const { status, hasBusinessHours } = useMerchantStatus();

  return (
      <div className="h-screen bg-gray-50 overflow-y-auto">
      <MerchantNavbar />

      {(status === null || hasBusinessHours === null) && 
        <div className="w-full h-full overflow-hidden flex flex-1 items-center justify-center">
          <PawLoading />
        </div>
      }

      {(status !== null && hasBusinessHours !== null) && <div className="container mx-auto px-4 py-8 pt-24 cursor-default">
        {(status === 'unverified' || !hasBusinessHours) && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8 text-center">
            <h1 className="text-2xl font-bold text-primary-800 mb-3">
              Welcome to Furk! 🐾
            </h1>
            <p className="text-primary-600 text-lg mb-4">
              We're excited to have you join our community of pet service providers. Let's get your business set up so you can start connecting with pet owners.
            </p>
            <p className="text-primary-600 mb-2 text-left">
              To get started, you'll need to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Business Requirements */}
              <div>
                <h3 className="font-semibold text-primary-800 mb-3">For Businesses</h3>
                <ul className="text-primary-700 mb-4">
                  <li className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"/>
                    Complete the verification process:
                  </li>
                  <ul className="list-disc list-inside ml-4 mb-2">
                    <li>Company Profile Document (PDF or DOC)</li>
                    <li>DTI/SEC Registration (Image or Scan)</li>
                    <li>BIR 2303/COR (Image or Scan)</li>
                    <li>Mayor's Permit(Image or Scan)</li>
                    <li>2 Valid IDs (Image or Scan)</li>
                    <li>1 Exterior Photo of Business</li>
                    <li>2 Interior Photos of Business</li>
                    <li>2 Videos of Actual Pet Service</li>
                  </ul>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"/>
                    Set your business hours
                  </li>
                </ul>
              </div>

              {/* Freelancer Requirements */}
              <div>
                <h3 className="font-semibold text-primary-800 mb-3">For Freelancers</h3>
                <ul className="text-primary-700 mb-4">
                  <li className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"/>
                    Complete the verification process:
                  </li>
                  <ul className="list-disc list-inside ml-4 mb-2">
                    <li>CV/Professional Background (PDF or DOC)</li>
                    <li>Current Address Proof (Image or Scan)</li>
                    <li>Permanent Address Proof (Image or Scan)</li>
                    <li>SSS ID/UMID (Image or Scan)</li>
                    <li>BIR TIN Document (Image or Scan)</li>
                    <li>1 Other Valid ID (Image or Scan)</li>
                    <li>NBI Clearance (Image or Scan)</li>
                    <li>3 Photos of Actual Pet Service</li>
                    <li>2 Videos of Actual Pet Service</li>
                  </ul>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"/>
                    Set your availability hours
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {status === 'unverified' && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between md:flex-row flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium text-warning-800">
                  Verification Required
                </h2>
                <p className="text-warning-600 mt-1">
                  Please complete the verification process to start listing services and unlock all merchant features.
                </p>
              </div>
              <div className="flex flex-col justify-center items-end">
                <Button
                  size="lg"
                  onClick={() => navigate('/merchant/verify')}
                >
                  Complete Verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-warning-800">
                  Verification Pending
                </h2>
                <p className="text-warning-600 mt-1">
                  Your account is currently pending verification. It may take 2 to 3 business working days.
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasBusinessHours && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between md:flex-row flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium text-warning-800">
                  Business Hours Required
                </h2>
                <p className="text-warning-600 mt-1">
                  Please set your business hours before setting up your services. This helps customers know when your services are available.
                </p>
              </div>
              <div className="flex flex-col justify-center md:items-end items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/merchant/business-hours')}
                  disabled={status === 'unverified'}
                >
                  Set Business Hours
                </Button>
                {status === 'unverified' && (
                  <p className="text-sm text-warning-600 mt-2 text-right">
                    Please verify your business first before setting business hours
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {status !== 'unverified' && 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                onClick={action.onClick}
                icon={action.icon}
                fullWidth
              >
                {action.title}
              </Button>
            ))}
          </div>
        }

        {statsLoading && <div className="w-full h-48 flex justify-center items-center">
          <PawLoading />  
        </div>}

        {/* KPI Cards */}
        {!statsLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivities
            recentActivity={recentActivities}
            loading={loading}
            hasMore={hasMore}
            lastActivityElementRef={lastActivityElementRef}
          />
          <TodaysSchedule onViewCalendar={() => navigate('/merchant/bookings')} />
        </div>
      </div>}
    </div>
  );
};

export default MerchantDashboard;