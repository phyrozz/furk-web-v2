import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Tag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';
import PawLoading from '../../common/PawLoading';
import ReviewsList from './ReviewsList';
import BookingDialog from './BookingDialog';
import { loginService } from '../../../services/auth/auth-service';
import { ToastService } from '../../../services/toast/toast-service';
import WarningContainer from '../../common/WarningContainer';

interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  service_category_name: string;
  price: string;
  merchant_id: number;
  business_name: number;
  merchant_type: string;
  email: string;
  phone_number: string;
  average_rating: number;
  attachments: string[];
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
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);
  const navigate = useNavigate();

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

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
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
                <MapPin className="w-6 h-6 mr-3 text-primary-500" />
                <Link to={`/merchants/${service.merchant_id}`} className="text-lg hover:underline">
                  {service.business_name}
                </Link>
              </motion.div>
              <motion.div 
                whileHover={{ x: 5 }}
                className="flex items-center"
              >
                <Star className="w-6 h-6 mr-3 text-accent-400" />
                <span className="text-lg font-semibold">{service.average_rating.toFixed(1)} Rating</span>
              </motion.div>
              <motion.div 
                whileHover={{ x: 5 }}
                className="flex items-center"
              >
                <Tag className="w-6 h-6 mr-3 text-primary-500" />
                <span className="text-lg">{service.service_category_name}</span>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex flex-row justify-between items-center"
            >
              <p className="sm:text-2xl text-xl sm:text-left text-center font-bold text-primary-500">₱{service.price}</p>
              <div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-1 h-full lg:pb-8 pb-0 order-1 lg:order-2"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-2xl font-semibold mb-4">Contact</h2>
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
              {isAuthenticated ? (isNotUser ? (
                <WarningContainer message="You are not a user. Please login/sign up as pet owner to book." />
              ) : (
                <Button
                variant="primary"
                className="w-full mt-6"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                Book Now
              </Button>
              )) : (
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    variant="primary"
                    className="w-full mt-6"
                    onClick={() => navigate('/login')}
                  >
                    Sign in now to book
                  </Button>
                </motion.div>
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
            
            <div className="lg:pb-0 pb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ReviewsList serviceId={service.id} />
              </div>
            </div>
          </motion.div>

          <BookingDialog
            isOpen={isBookingDialogOpen}
            onClose={() => setIsBookingDialogOpen(false)}
            serviceId={service.id}
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;