import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, Mail } from 'lucide-react';
import Button from '../../common/Button';
import { PetServicesService } from '../../../services/pet-services/pet-services';

interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  service_category_name: string;
  price: string;
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

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const petServicesService = new PetServicesService();
        const response = await petServicesService.getServiceDetails(Number(id));
        setService(response.data);
        document.title = `${response.data.name} - FURK`;
      } catch (err) {
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServiceDetails();
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
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce delay-100" />
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Service not found'}
          </h2>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="relative h-96">
        {service.attachments.length > 0 && (
          <img
            src={service.attachments[0]}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">{service.name}</h1>
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{service.business_name}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                <span>{service.average_rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>{service.service_category_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">About</h2>
              <p className="text-gray-600">{service.description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
              <div className="border rounded-lg p-4">
                <p className="text-2xl font-bold text-primary-500 my-2">
                  ₱{service.price}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-2xl font-semibold mb-4">Contact</h2>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3" />
                  <a href={`tel:${service.phone_number}`}>{service.phone_number}</a>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-3" />
                  <a href={`mailto:${service.email}`}>{service.email}</a>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={() => alert('Booking functionality coming soon!')}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;