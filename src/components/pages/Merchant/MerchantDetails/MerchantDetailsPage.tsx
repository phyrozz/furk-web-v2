import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MerchantDetailsService } from '../../../../services/merchant-details/merchant-details';
import ServicesList from './ServicesList';
import LocationPicker from '../../../common/LocationPicker';
import PawLoading from '../../../common/PawLoading';
import ShareDialog from '../../../common/ShareDialog';
import { MessageCircle, Share2 } from 'lucide-react';
import Button from '../../../common/Button';
import { loginService } from '../../../../services/auth/auth-service';
import { ToastService } from '../../../../services/toast/toast-service';
import DateUtils from '../../../../utils/date-utils';

interface MerchantDetails {
  id: string;
  business_name: string;
  merchant_type: string;
  created_at: string;
  address: string;
  city: string;
  province: string;
  barangay: string;
  email: string;
  phone_number: string;
  longitude: number;
  latitude: number;
  overall_rating: number;
  exterior_photo?: string;
  business_hours?: BusinessHour[];
  break_hours?: BreakHour[];
  closures?: ClosureWindow[];
}

interface BusinessHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface BreakHour {
  day_of_week: number;
  break_start: string;
  break_end: string;
  label?: string;
}

interface ClosureWindow {
  id: number;
  start_datetime: string;
  end_datetime: string;
  reason?: string | null;
}

const MerchantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const navigate = useNavigate();

  const merchantService = new MerchantDetailsService();

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchMerchantDetails = async () => {
      try {
        if (!id) return;
        const merchantData = await merchantService.getMerchantDetails(id);
        setMerchant(merchantData.data);
      } catch (error) {
        console.error('Error fetching merchant details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantDetails();

    const fetchAuthState = async () => {
      try {
        const authenticated = await loginService.isAuthenticated();
        setIsAuthenticated(authenticated);
        setIsUser(loginService.getUserRole() === 'user');
      } catch (error) {
        console.error('Error fetching auth state:', error);
      }
    };

    fetchAuthState();
  }, [id]);

  const handleStartConversation = async () => {
    if (!merchant?.id) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isUser) {
      ToastService.show('Only pet owners can start merchant conversations.');
      return;
    }

    try {
      setStartingConversation(true);
      const response = await merchantService.startConversation(merchant.id);
      navigate(`/chat/${response.data.id}`, {
        replace: true,
        state: {
          conversation: response.data,
        },
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      ToastService.show('Failed to open merchant conversation.');
    } finally {
      setStartingConversation(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center overflow-hidden">
        <PawLoading />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-xl">Merchant not found</p>
      </div>
    );
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const businessHours = merchant.business_hours || [];
  const breakHours = merchant.break_hours || [];
  const closures = merchant.closures || [];
  const now = new Date();
  const upcomingClosures = closures.filter((closure) => {
    const endDate = new Date(closure.end_datetime);
    return endDate >= now;
  });

  return (
    <>
      <ShareDialog 
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        shareUrl={window.location.href}
        socials={[
          { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}` },
          { name: 'Twitter', url: `https://www.twitter.com/intent/tweet?url=${window.location.href}` },
          { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${window.location.href}` },
          { name: 'Email', url: `mailto:?subject=Check%20out%20this%20pet%20merchant&body=${window.location.href}` }
        ]}
      />

      <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 py-8 space-y-8 cursor-default"
    >
      {/* Hero Section with Business Info and Photo */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex justify-between items-start">
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900"
            >
              {merchant.business_name}
            </motion.h1>
            <Button
              onClick={() => setShowShareDialog(true)}
              variant='ghost'
            >
              <Share2 />
            </Button>
          </div>
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-2"
          >
            <span className="text-accent-400 text-2xl">★</span>
            <span className="text-gray-900 font-semibold text-xl">{merchant.overall_rating.toFixed(1)}</span>
          </motion.div>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">Type:</span> {merchant.merchant_type}
            </p>
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">Location:</span> {merchant.address}, {merchant.barangay}, {merchant.city}, {merchant.province}
            </p>
          </div>
        </div>
        <div className="h-[400px] rounded-xl overflow-hidden">
          <img
            src={merchant.exterior_photo || '/logo_new_small.png'}
            alt={merchant.business_name}
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">Email:</span> {merchant.email}
          </p>
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">Phone:</span> {merchant.phone_number}
          </p>
        </div>
        <div className="mt-6">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            icon={<MessageCircle size={18} />}
            onClick={handleStartConversation}
            loading={startingConversation}
          >
            {isAuthenticated ? 'Message Merchant' : 'Sign in to Message'}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Schedule</h2>

        {businessHours.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Business Hours</h3>
              <div className="space-y-2">
                {businessHours.map((hour, index) => (
                  <div key={`${hour.day_of_week}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">{dayLabels[hour.day_of_week] || `Day ${hour.day_of_week}`}</span>
                    <span className="text-gray-600">
                      {DateUtils.formatTimeString(hour.open_time)} - {DateUtils.formatTimeString(hour.close_time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {breakHours.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Break Hours</h3>
                <div className="space-y-2">
                  {breakHours.map((breakHour, index) => (
                    <div key={`${breakHour.day_of_week}-${index}`} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                      <span className="font-medium text-amber-900">
                        {breakHour.label || 'Break'} - {dayLabels[breakHour.day_of_week] || `Day ${breakHour.day_of_week}`}
                      </span>
                      <span className="text-amber-800">
                        {DateUtils.formatTimeString(breakHour.break_start)} - {DateUtils.formatTimeString(breakHour.break_end)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcomingClosures.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Upcoming Closures</h3>
                <div className="space-y-2">
                  {upcomingClosures.map((closure) => (
                    <div key={closure.id} className="rounded-lg bg-rose-50 px-3 py-2 text-sm">
                      <div className="font-medium text-rose-900">
                        {DateUtils.formatDateTimeString(closure.start_datetime)} - {DateUtils.formatDateTimeString(closure.end_datetime)}
                      </div>
                      {closure.reason && <div className="text-rose-700 mt-1">{closure.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No business hours have been set yet.</p>
        )}
      </motion.div>

      {/* Services Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gray-50 rounded-xl shadow-md p-6"
      >
        <ServicesList merchantId={merchant.id} />
      </motion.div>

      {/* Map Location */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
        <div className="h-96 rounded-lg overflow-hidden bg-gray-100">
          {merchant.latitude && merchant.longitude && <LocationPicker initialLat={merchant.latitude} initialLng={merchant.longitude} onChange={() => {}} readonly />}
        </div>
      </motion.div>
    </motion.div>
    </>
  );
};

export default MerchantDetailsPage;
