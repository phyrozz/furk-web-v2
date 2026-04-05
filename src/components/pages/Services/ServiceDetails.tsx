import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Tag, Heart, Share2, MessageCircle, Clock3, AlertTriangle, Sun, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import PawLoading from '../../common/PawLoading';
import ReviewsList, { ReviewsListRef } from './ReviewsList';
import BookingDialog from './BookingDialog';
import { loginService } from '../../../services/auth/auth-service';
import { ToastService } from '../../../services/toast/toast-service';
import WarningContainer from '../../common/WarningContainer';
import ReviewDialog from './ReviewDialog';
import RecommendedServicesList from './RecommendedServicesList';
import ShareDialog from '../../common/ShareDialog';
import { Rating } from 'react-simple-star-rating';
import DateUtils from '../../../utils/date-utils';
import LocationPicker from '../../common/LocationPicker';
import { MerchantDetailsService } from '../../../services/merchant-details/merchant-details';

interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  service_category_name: string;
  requires_pet?: boolean;
  price: string;
  furkredit_price: number;
  merchant_id: number;
  business_name: number;
  merchant_type: string;
  email: string;
  phone_number: string;
  average_rating: number;
  attachments: string[];
  business_hours: BusinessHour[];
  break_hours?: BreakHour[];
  closures?: ClosureWindow[];
  hasBooked: boolean;
  has_reviewed: boolean;
  last_completed_timestamp: string | null;
  rating_count: number;
  duration?: number;
  latitude?: number;
  longitude?: number;
  business_status?: BusinessStatus;
}

export interface BusinessHour {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface BreakHour {
  id: number;
  day_of_week: number;
  break_start: string;
  break_end: string;
  label: string;
}

interface ClosureWindow {
  id: number;
  start_datetime: string;
  end_datetime: string;
  reason?: string | null;
}

interface BusinessStatus {
  is_open: boolean;
  status: 'open' | 'closed' | 'break' | 'closure';
  notice: string;
  upcoming_notice?: string | null;
  closure_reason?: string | null;
  closure_until?: string | null;
  break_label?: string | null;
  break_until?: string | null;
  business_hours_today?: {
    open_time: string;
    close_time: string;
  };
}

const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isNotUser, setIsNotUser] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [hasBooked, setHasBooked] = useState<boolean>(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [startingConversation, setStartingConversation] = useState<boolean>(false);
  const navigate = useNavigate();
  const reviewsRef = useRef<ReviewsListRef>(null);
  const merchantDetailsService = new MerchantDetailsService();

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchIsAuthenticated = async () => {
      try {
        const isAuthenticated = await loginService.isAuthenticated();
        const userRole = loginService.getUserRole();
        setIsAuthenticated(isAuthenticated);
        if (userRole !== 'user') setIsNotUser(true);
      } catch (error) {
        console.error('Error fetching authentication status:', error);
      }
    };

    const fetchServiceDetails = async () => {
      try {
        setIsFavoriteLoading(true);
        setLoading(true);
        const petServicesService = new PetServicesService();
        const response = await petServicesService.getServiceDetails(Number(id));
        setService(response.data);
        setIsFavorite(response.data.is_favorite);
        setHasBooked(response.data.has_booked);
        document.title = `${response.data.name} - FURK`;
      } catch (err) {
        setError('Failed to load service details');
      } finally {
        setLoading(false);
        setIsFavoriteLoading(false);
      }
    };

    if (id) {
      fetchServiceDetails();
      fetchIsAuthenticated();
    }

    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center overflow-hidden">
        <PawLoading />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Service not found'}
          </h2>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  const onFavorite = async () => {
    setIsFavoriteLoading(true);
    const dataService = new PetServicesService();

    if (isFavorite) {
      await dataService.removeToFavorites(Number(id)).then(
        () => {
          setIsFavorite(false);
          ToastService.show('Service removed from favorites');
        },
        () => {
          ToastService.show('Error removing service from favorites');
        }
      );
    } else {
      await dataService.addToFavorites(Number(id)).then(
        () => {
          setIsFavorite(true);
          ToastService.show('Service added to favorites');
        },
        () => {
          ToastService.show('Error adding service to favorites');
        }
      );
    }

    setIsFavoriteLoading(false);
  }

  const handleBookingDialogClose = () => {
    setIsBookingDialogOpen(false);
  }

  const handleBookingDialogSuccess = () => {
    setHasBooked(true);
  }

  const onReviewSubmit = () => {
    reviewsRef.current?.reset(); // Trigger refresh of reviews
  };

  const handleStartConversation = async () => {
    if (!service?.merchant_id) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isNotUser) {
      ToastService.show('Only pet owners can start merchant conversations.');
      return;
    }

    try {
      setStartingConversation(true);
      const response = await merchantDetailsService.startConversation(String(service.merchant_id));
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

  const isReviewable = () => {
    const lastCompletedTimestamp = service.last_completed_timestamp;
    if (!lastCompletedTimestamp) return false;
    const lastCompletedDate = new Date(lastCompletedTimestamp);
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(currentDate.getDate() - 7);
    return lastCompletedDate >= oneWeekAgo;
  }

  function formatTime(value: string) {
    return DateUtils.formatTimeString(value);
  }

  const businessHours = service.business_hours || [];
  const breakHours = service.break_hours || [];
  const closures = service.closures || [];
  const upcomingClosures = closures.filter((closure) => new Date(closure.end_datetime) >= new Date());
  const businessStatus = service.business_status || (() => {
    const now = new Date();
    const today = DateUtils.getBusinessDayIndex(now);
    const nowTime = now.toTimeString().slice(0, 8);
    const todaysHours = businessHours.find((hour) => hour.day_of_week === today);
    const hasOperatingHoursToday = Boolean(
      todaysHours &&
      todaysHours.open_time &&
      todaysHours.close_time
    );
    const activeClosure = upcomingClosures.find((closure) => {
      const start = new Date(closure.start_datetime);
      const end = new Date(closure.end_datetime);
      return start <= now && now <= end;
    });

    if (activeClosure) {
      return {
        is_open: false,
        status: 'closure' as const,
        notice: 'Business is temporarily closed today.',
        closure_reason: activeClosure.reason || null,
        closure_until: activeClosure.end_datetime,
        upcoming_notice: activeClosure.reason
          ? `Closure notice: ${activeClosure.reason}`
          : 'Business is closed today due to a temporary closure.',
      };
    }

    if (!hasOperatingHoursToday) {
      return {
        is_open: false,
        status: 'closed' as const,
        notice: 'Business is closed today.',
        business_hours_today: undefined,
      };
    }

    if (nowTime < todaysHours!.open_time || nowTime > todaysHours!.close_time) {
      return {
        is_open: false,
        status: 'closed' as const,
        notice: todaysHours
          ? `Business is closed today. Open from ${formatTime(todaysHours.open_time)} to ${formatTime(todaysHours.close_time)}.`
          : 'Business is closed today.',
        business_hours_today: todaysHours
          ? { open_time: todaysHours.open_time, close_time: todaysHours.close_time }
          : undefined,
      };
    }

    const activeBreak = breakHours.find(
      (breakHour) =>
        breakHour.day_of_week === today &&
        breakHour.break_start <= nowTime &&
        nowTime <= breakHour.break_end
    );

    if (activeBreak) {
      return {
        is_open: false,
        status: 'break' as const,
        notice: `Business is on break today until ${formatTime(activeBreak.break_end)}.`,
        break_label: activeBreak.label,
        break_until: activeBreak.break_end,
      };
    }

    const upcomingBreak = breakHours.find(
      (breakHour) => breakHour.day_of_week === today && breakHour.break_start > nowTime
    );

    return {
      is_open: true,
      status: 'open' as const,
      notice: 'Business is open now.',
      business_hours_today: todaysHours
        ? { open_time: todaysHours.open_time, close_time: todaysHours.close_time }
        : undefined,
      upcoming_notice: upcomingBreak
        ? `Upcoming break at ${formatTime(upcomingBreak.break_start)}${upcomingBreak.break_end ? ` until ${formatTime(upcomingBreak.break_end)}` : ''}.`
        : undefined,
    };
  })();
  const statusStyles = {
    open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-50 text-slate-800 border-slate-200',
    break: 'bg-amber-50 text-amber-900 border-amber-200',
    closure: 'bg-rose-50 text-rose-900 border-rose-200',
  }[businessStatus?.status || 'closed'];

  const statusIcon = {
    open: <Sun size={18} className="text-emerald-600" />,
    closed: <Clock3 size={18} className="text-slate-600" />,
    break: <Coffee size={18} className="text-amber-600" />,
    closure: <AlertTriangle size={18} className="text-rose-600" />,
  }[businessStatus?.status || 'closed'];

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hasBusinessHoursToday = businessHours.some((hour) => hour.day_of_week === DateUtils.getBusinessDayIndex(new Date()));

  return (
    <>
      <BookingDialog
        isOpen={isBookingDialogOpen}
        onClose={handleBookingDialogClose}
        onSuccess={handleBookingDialogSuccess}
        serviceId={service.id}
        requiresPet={service.requires_pet !== false}
        businessHours={service.business_hours}
        bookingAmount={String(service.furkredit_price)}
        merchantId={service.merchant_id}
      />
      <ShareDialog 
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        shareUrl={window.location.href}
        socials={[
          { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}` },
          { name: 'Twitter', url: `https://www.twitter.com/intent/tweet?url=${window.location.href}` },
          { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${window.location.href}` },
          { name: 'Email', url: `mailto:?subject=Check%20out%20this%20pet%20service&body=${window.location.href}` }
        ]}
      />

      {service.last_completed_timestamp && isReviewable() && !service.has_reviewed && <ReviewDialog serviceId={service.id} onReviewSubmit={onReviewSubmit} />}
      <div className="pt-24 min-h-screen bg-gray-50 select-none">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          >
            {/* Left Column - Service Information */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-8 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h1 className="sm:text-4xl text-2xl font-bold text-gray-900 mb-6">{service.name}</h1>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center"
                >
                  <Link to={`/merchants/${service.merchant_id}`} className="text-lg hover:underline">
                    {service.business_name}
                  </Link>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="inline-block"
                >
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {service.service_category_name}
                  </span>
                </motion.div>
                <div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    service.requires_pet === false
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {service.requires_pet === false ? 'Pet owner QR service' : 'Pet required'}
                  </span>
                </div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-end gap-2"
                >
                  <Rating
                    initialValue={service.average_rating / 2}
                    size={24}
                    allowFraction
                    SVGstyle={{ "display": "inline" }}
                    readonly
                  />
                  <span className="font-semibold">
                    {(service.average_rating / 2).toFixed(1)}
                    {` (${service.rating_count} reviews)`}
                  </span>
                </motion.div>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-row justify-between items-center"
              >
                <div className="flex flex-col">
                  <p className="sm:text-2xl text-xl font-bold text-primary-500">
                    {Number(service.furkredit_price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    <span className="text-base"> Furkredits</span>
                  </p>
                  {service.duration != null && service.duration !== 0 && <span className="text-gray-500 text-sm">
                    ⏱ {DateUtils.formatDuration(service.duration)}
                  </span>}
                </div>

                <div className='flex items-center'>
                  <Button onClick={() => setShowShareDialog(true)} variant='ghost'>
                    <Share2 />
                  </Button>
                  <Button
                    icon={<Heart fill={isFavorite ? "currentColor" : "none"} />}
                    variant="ghost"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        navigate('/login');
                      } else {
                        await onFavorite();
                      }
                    }}
                    loading={isFavoriteLoading}
                  />
                </div>            
              </motion.div>
            </motion.div>

            {/* Right Column - Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-lg overflow-hidden shadow-lg"
            >
              {service.attachments.length > 0 && (
                <>
                  <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    src={service.attachments[selectedImage]}
                    alt={`${service.name} - Image ${selectedImage + 1}`}
                    className="w-full h-[400px] object-cover"
                  />
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute bottom-4 left-4 right-4 bg-white/90 rounded-lg p-3"
                  >
                    <div className="flex gap-2 overflow-x-auto overflow-y-hidden">
                      {service.attachments.map((attachment, index) => (
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          key={index}
                          src={attachment}
                          alt={`${service.name} - Thumbnail ${index + 1}`}
                          className={`w-16 h-16 object-cover rounded cursor-pointer transition-all flex-shrink-0 ${
                            selectedImage === index ? 'ring-2 ring-primary-500' : 'opacity-70 hover:opacity-100'
                          }`}
                          onClick={() => setSelectedImage(index)}
                        />
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 select-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-1 h-full lg:pb-8 pb-0 order-1 lg:order-2"
            >
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-2xl font-semibold mb-4">Contact</h2>
                {businessStatus && (
                  <div className={`mb-5 rounded-xl border px-4 py-3 ${statusStyles}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{statusIcon}</div>
                      <div className="min-w-0">
                        <p className="font-semibold capitalize">
                          {businessStatus.status === 'closure' ? 'Temporarily closed' : businessStatus.status}
                        </p>
                        <p className="text-sm leading-5">{businessStatus.notice}</p>
                        {businessStatus.business_hours_today && businessStatus.status === 'open' && (
                          <p className="text-xs mt-1 opacity-80">
                            Today: {formatTime(businessStatus.business_hours_today.open_time)} - {formatTime(businessStatus.business_hours_today.close_time)}
                          </p>
                        )}
                        {businessStatus.closure_reason && (
                          <p className="text-xs mt-1 opacity-80">
                            Reason: {businessStatus.closure_reason}
                          </p>
                        )}
                        {businessStatus.upcoming_notice && (
                          <p className="text-xs mt-1 font-medium">
                            {businessStatus.upcoming_notice}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex items-center text-gray-600"
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    <a href={`tel:${service.phone_number}`}>{service.phone_number}</a>
                  </motion.div>
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex items-center text-gray-600"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    <a href={`mailto:${service.email}`}>{service.email}</a>
                  </motion.div>
                </div>

                <div className="mt-6 space-y-3">
                  {isAuthenticated ? (
                    isNotUser ? (
                      <WarningContainer message="You are not a user. Please login/sign up as pet owner to book." />
                    ) : hasBooked ? (
                      <WarningContainer message="You have already booked this service. Please check your profile for the booking status." />
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setIsBookingDialogOpen(true)}
                      >
                        Book Now
                      </Button>
                    )
                  ) : (
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => navigate('/login')}
                      >
                        Sign in now to book
                      </Button>
                    </motion.div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    icon={<MessageCircle size={18} />}
                    onClick={handleStartConversation}
                    loading={startingConversation}
                  >
                    {isAuthenticated ? 'Message Merchant' : 'Sign in to Message'}
                  </Button>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Business Hours</h3>
                    {!hasBusinessHoursToday && (
                      <span className="text-xs font-medium rounded-full bg-slate-100 text-slate-700 px-2 py-1">
                        Closed today
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {businessHours.length > 0 ? (
                      businessHours.map((hour) => (
                        <div key={`${hour.id}-${hour.day_of_week}-${hour.open_time}-${hour.close_time}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <span className="font-medium text-gray-700">{dayLabels[hour.day_of_week] || `Day ${hour.day_of_week}`}</span>
                          <span className="text-gray-600">
                            {formatTime(hour.open_time)} - {formatTime(hour.close_time)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        No business hours have been set yet.
                      </div>
                    )}
                  </div>
                </div>

                {breakHours.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Break Hours</h3>
                    <div className="space-y-2">
                      {breakHours
                        .filter((breakHour) => (
                          breakHour.day_of_week !== null &&
                          breakHour.day_of_week !== undefined &&
                          breakHour.break_start &&
                          breakHour.break_end
                        ))
                        .map((breakHour) => (
                          <div key={`${breakHour.id}-${breakHour.day_of_week}-${breakHour.break_start}-${breakHour.break_end}`} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                            <span className="font-medium text-amber-900">
                              {breakHour.label || 'Break'} - {DateUtils.getDayLabel(breakHour.day_of_week)}
                            </span>
                            <span className="text-amber-800">
                              {formatTime(breakHour.break_start)} - {formatTime(breakHour.break_end)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {upcomingClosures.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Upcoming Closures</h3>
                    <div className="space-y-2">
                      {upcomingClosures.map((closure) => (
                        <div key={`${closure.id}-${closure.start_datetime}`} className="rounded-lg bg-rose-50 px-3 py-2 text-sm">
                          <div className="font-medium text-rose-900">
                            {DateUtils.formatDateTimeString(closure.start_datetime)} - {DateUtils.formatDateTimeString(closure.end_datetime)}
                          </div>
                          {closure.reason && (
                            <div className="text-rose-700 mt-1">{closure.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:col-span-2 space-y-8 lg:pb-8 pb-0 order-2 lg:order-1"
            >
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">About</h2>
                <p className="text-gray-600">{service.description}</p>
              </div>

              {/* Map Location */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Location</h2>
                <div className="h-96 rounded-lg overflow-hidden bg-gray-100">
                  {service.latitude && service.longitude && <LocationPicker initialLat={service.latitude} initialLng={service.longitude} onChange={() => {}} readonly />}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Similar Services</h2>
                <RecommendedServicesList 
                  serviceId={service.id}
                />
              </div>
              
              <div className="lg:pb-0 pb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <ReviewsList serviceId={service.id} ref={reviewsRef} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetails;
