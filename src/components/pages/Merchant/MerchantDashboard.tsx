import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Package, Plus, List, MapPin, Pen } from 'lucide-react';
import TodaysSchedule from './MerchantDashboard/TodaysSchedule';
import MerchantWelcome from './MerchantDashboard/MerchantWelcome';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import MerchantNavbar from '../../common/MerchantNavbar';
import DashboardStat from '../../common/DashboardStat';
import { MerchantDashboardService } from '../../../services/merchant-dashboard/merchant-dashboard';
import PawLoading from '../../common/PawLoading';
import { RecentActivities } from './MerchantDashboard/RecentActivities';
import { useLazyLoad } from '../../../hooks/useLazyLoad';
import { useMerchantStatus } from '../../../hooks/useMerchantStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPesoSign } from "@fortawesome/free-solid-svg-icons";
import LocationPicker from '../../common/LocationPicker';
import { ToastService } from '../../../services/toast/toast-service';
import GuidedTour, { TourStep } from '../../common/GuidedTour';
import { verificationStatuses } from './MerchantVerification/verification-status';

const merchantDashboardService = new MerchantDashboardService();
const VERIFIED_NOTICE_SEEN_KEY = 'furk_merchant_verified_dashboard_notice_seen';

const tourSteps: TourStep[] = [
  {
    targetId: 'btn-complete-verification',
    title: 'Start verification',
    description: 'Tell us about your business or freelance work and upload the documents needed for your provider type.',
  },
  {
    targetId: 'btn-set-business-hours',
    title: 'Set your available hours',
    description: 'After submitting your verification application, choose the days and times you offer services. Add your hours before listing your services.',
  },
  {
    targetId: 'quick-action-list-new-service',
    title: 'Add New Service',
    description: 'Click here to add a new pet service to your listings. You can define categories, pricing, and details.',
    videoFileName: 'list-service.webp'
  },
  {
    targetId: 'quick-action-manage-services',
    title: 'Manage Your Services',
    description: 'Here you can view, edit, or remove your existing services and categories.',
    videoFileName: 'manage-services.webp'
  },
  {
    targetId: 'quick-action-view-bookings',
    title: 'View All Bookings',
    description: 'Access your full booking calendar to see upcoming and past appointments.',
    videoFileName: 'view-bookings.webp'
  },
  {
    targetId: 'kpi-cards-container',
    title: 'Your Performance at a Glance',
    description: 'Monitor your total bookings, pending requests, and monthly earnings right here.',
  },
  {
    targetId: 'recent-activities-container',
    title: 'Recent Activity',
    description: 'Stay updated with the latest actions, including new booking requests and status updates.',
  },
  {
    targetId: 'todays-schedule-container',
    title: "Today's Schedule",
    description: 'Check your appointments for today and manage them as they happen.',
  },
  {
    targetId: 'business-location-container',
    title: 'Business Location',
    description: 'Ensure your business location is accurate so pet owners can find you easily on the map.',
  }
];

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

interface MerchantLocation {
  latitude: number;
  longitude: number;
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
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationSaving, setLocationSaving] = useState<boolean>(false);
  const [merchantLocation, setMerchantLocation] = useState<MerchantLocation | null>(null);
  const [editedLocation, setEditedLocation] = useState<MerchantLocation | null>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [activeTourSteps, setActiveTourSteps] = useState<TourStep[]>([]);
  const [hasSeenVerifiedNotice] = useState(() => localStorage.getItem(VERIFIED_NOTICE_SEEN_KEY) === 'true');

  const { status, hasBusinessHours } = useMerchantStatus();

  useEffect(() => {
    if (status === 'verified' && hasBusinessHours && !hasSeenVerifiedNotice) {
      localStorage.setItem(VERIFIED_NOTICE_SEEN_KEY, 'true');
    }
  }, [status, hasBusinessHours, hasSeenVerifiedNotice]);

  useEffect(() => {
    // Only show tour if not already seen
    const tourSeen = localStorage.getItem('furk_merchant_tour_seen');
    if (tourSeen === 'true') return;

    if (status !== null && hasBusinessHours !== null && !statsLoading) {
      // Filter tour steps based on current merchant status and UI state
      const filteredSteps = tourSteps.filter(step => {
        const element = document.getElementById(step.targetId);
        // Only include steps where the target element is currently in the DOM
        return !!element;
      });

      if (filteredSteps.length > 0) {
        setActiveTourSteps(filteredSteps);
        
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 1000); // Increased delay to ensure DOM is fully settled

        return () => clearTimeout(timer);
      }
    }
  }, [status, hasBusinessHours, statsLoading]);

  const handleTourClose = () => {
    setIsTourOpen(false);
    localStorage.setItem('furk_merchant_tour_seen', 'true');
  };

  const handleTourFinish = () => {
    setIsTourOpen(false);
    localStorage.setItem('furk_merchant_tour_seen', 'true');
  };

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

  const fetchMerchantLocation = async () => {
    try {
      const response: any = await merchantDashboardService.getMerchantLocation();
      const location = response?.data;

      if (typeof location?.latitude === 'number' && typeof location?.longitude === 'number') {
        const currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        setMerchantLocation(currentLocation);
        setEditedLocation(currentLocation);
      } else {
        setMerchantLocation(null);
        setEditedLocation({
          latitude: 14.5995,
          longitude: 120.9842
        });
      }
    } catch (error) {
      console.error('Failed to fetch merchant location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!editedLocation) {
      return;
    }

    try {
      setLocationSaving(true);
      await merchantDashboardService.updateMerchantLocation(editedLocation.longitude, editedLocation.latitude);
      setMerchantLocation(editedLocation);
      ToastService.show('Business location updated successfully!');
    } catch (error) {
      console.error('Failed to update merchant location:', error);
      ToastService.show('Failed to update business location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleLocationSearch = async (query: string) => {
    try {
      const response: any = await merchantDashboardService.searchLocations(query, 6);
      return response?.data || [];
    } catch (error) {
      console.error('Error searching map locations:', error);
      return [];
    }
  };

  const hasLocationChanges = Boolean(
    editedLocation &&
    (
      !merchantLocation ||
      editedLocation.latitude !== merchantLocation.latitude ||
      editedLocation.longitude !== merchantLocation.longitude
    )
  );

  const { items: recentActivities, loadMore, loading, hasMore } = useLazyLoad<Activity>({
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
    fetchMerchantLocation();
  }, []);

  const navigate = useNavigate();
  
  const cards: DashboardCard[] = [
    {
      title: 'Total Bookings',
      value: stats.total_bookings_count,
      icon: <Package size={24} />,
      color: 'bg-primary-50 text-primary-700',
    },
    {
      title: 'Pending Bookings',
      value: stats.pending_only_count,
      icon: <Clock size={24} />,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmed_only_count,
      icon: <Calendar size={24} />,
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Monthly Earnings',
      value: stats.monthly_earnings,
      icon: <FontAwesomeIcon icon={faPesoSign} size="lg" />,
      color: 'bg-secondary-50 text-secondary-700',
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
    {
      title: 'Edit Profile',
      icon: <Pen size={20} />,
      onClick: () => navigate('/merchant/profile'),
    },
  ];

  return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto lg:mt-0 mt-16 lg:pl-[var(--merchant-navbar-width,18rem)]">
      <MerchantNavbar />

      {(status === null || hasBusinessHours === null) && 
        <div className="w-full h-screen overflow-hidden flex flex-1 items-center justify-center">
          <PawLoading />
        </div>
      }

      {(status !== null && hasBusinessHours !== null) && <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 md:px-6 lg:px-8 cursor-default">
        {(status === 'unverified' || ((status === 'verified' || status === 'pending') && !hasBusinessHours)) && (
          <MerchantWelcome status={status} hasBusinessHours={hasBusinessHours} />
        )}

        {status === 'verified' && hasBusinessHours && (
          hasSeenVerifiedNotice ? (
            <section aria-label="Your verification" className="furk-panel mb-8 flex items-center justify-between gap-4 p-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${verificationStatuses.verified.className}`}>Verified</span>
                <p className="truncate text-sm font-semibold text-gray-800">Your account is verified</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/merchant/verification')} className="shrink-0">View verification</Button>
            </section>
          ) : (
            <section aria-label="Your verification" className="furk-panel mb-8 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${verificationStatuses[status].className}`}>{verificationStatuses[status].label}</span>
                <h2 className="mt-3 text-lg font-bold text-gray-900">Your verification</h2>
                <p className="mt-1 text-sm text-gray-600">{verificationStatuses[status].description}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/merchant/verification')} className="shrink-0">View verification</Button>
            </section>
          )
        )}

        {status !== 'unverified' && status !== 'verified' && !((status === 'pending') && !hasBusinessHours) && (
          <section aria-label="Your verification" className="furk-panel mb-8 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${verificationStatuses[status].className}`}>{verificationStatuses[status].label}</span>
              <h2 className="mt-3 text-lg font-bold text-gray-900">Your verification</h2>
              <p className="mt-1 text-sm text-gray-600">{verificationStatuses[status].description}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/merchant/verification')} className="shrink-0">View verification</Button>
          </section>
        )}

        {!hasBusinessHours && (status === 'rejected' || status === 'suspended') && (
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
                  id="btn-set-business-hours"
                  size="lg"
                  onClick={() => navigate('/merchant/business-hours')}
                >
                  Set Business Hours
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {status !== 'unverified' && 
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                id={`quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
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
        {!statsLoading && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8" id="kpi-cards-container">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="furk-panel overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <DashboardStat title={card.title} value={card.value} icon={card.icon} iconClassName={card.color} />
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

        <div className="my-8 grid grid-cols-1 gap-4">
          <div className="furk-panel p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Profile setup</p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">Keep your business details current</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Update your business name, address, and contact details from your merchant profile so customers see the right information.
                </p>
              </div>
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
                <MapPin size={24} />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="text-sm text-gray-500">
                Need to correct your address or other profile info? Jump straight to editing.
              </div>
              <Button onClick={() => navigate('/merchant/profile')}>
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="furk-panel mt-8 p-5 sm:p-6" id="business-location-container">
          <div className="flex md:flex-row flex-col md:items-center items-start md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Business Location</h2>
              <p className="text-sm text-gray-600">Drag the pin or click the map to update your business location.</p>
            </div>
            <Button
              onClick={handleSaveLocation}
              loading={locationSaving}
              disabled={!hasLocationChanges || locationLoading || !editedLocation}
            >
              Save Pin Location
            </Button>
          </div>

          {locationLoading || !editedLocation ? (
            <div className="w-full h-60 flex items-center justify-center">
              <PawLoading />
            </div>
          ) : (
            <>
              <LocationPicker
                initialLat={editedLocation.latitude}
                initialLng={editedLocation.longitude}
                enableSearch
                searchLocations={handleLocationSearch}
                onChange={(lat, lng) => setEditedLocation({ latitude: lat, longitude: lng })}
              />
              <p className="mt-3 text-sm text-gray-600">
                Lat: {editedLocation.latitude.toFixed(6)} | Lng: {editedLocation.longitude.toFixed(6)}
              </p>
            </>
          )}
        </div>
      </div>}
      <GuidedTour
        isOpen={isTourOpen && activeTourSteps.length > 0}
        steps={activeTourSteps}
        onClose={handleTourClose}
        onFinish={handleTourFinish}
      />
    </div>
  );
};

export default MerchantDashboard;
