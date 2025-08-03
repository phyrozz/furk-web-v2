import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MerchantDetailsService } from '../../../../services/merchant-details/merchant-details';
import ServicesList from './ServicesList';
import LocationPicker from '../../../common/LocationPicker';
import PawLoading from '../../../common/PawLoading';

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
  exterior_photo: string;
}

const MerchantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 py-8 space-y-8 cursor-default"
    >
      {/* Hero Section with Business Photo */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-96 rounded-xl overflow-hidden shadow-lg"
      >
        <img
          src={merchant.exterior_photo}
          alt={merchant.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
          <div className="absolute bottom-0 left-0 p-8">
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {merchant.business_name}
            </motion.h1>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-2"
            >
              <span className="text-accent-400 text-xl">★</span>
              <span className="text-white font-semibold">{merchant.overall_rating.toFixed(1)}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Business Information */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Type:</span> {merchant.merchant_type}
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Location:</span> {merchant.address}, {merchant.barangay}, {merchant.city}, {merchant.province}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Email:</span> {merchant.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Phone:</span> {merchant.phone_number}
              </p>
            </div>
          </div>
        </div>
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
  );
};

export default MerchantDetailsPage;