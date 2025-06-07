import { motion } from 'framer-motion';
import { Scissors, Stethoscope, Home, Award } from 'lucide-react';
import ServiceCard from '../../common/ServiceCard';
import { useMemo, useState } from 'react';

const WhatsNewSection = () => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const services = useMemo(() => [
    {
      title: 'Mobile Pet Grooming',
      description: 'Professional grooming services that come to your doorstep. Convenient and stress-free for your pets.',
      icon: <Scissors size={24} />,
      imageUrl: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg',
    },
    {
      title: 'Telemedicine Vet Consults',
      description: 'Connect with licensed veterinarians through video calls for quick advice and consultations.',
      icon: <Stethoscope size={24} />,
      imageUrl: 'https://images.pexels.com/photos/7470753/pexels-photo-7470753.jpeg',
    },
    {
      title: 'Luxury Pet Boarding',
      description: 'Premium accommodations for your pets while you are away. Includes playtime, grooming, and special care.',
      icon: <Home size={24} />,
      imageUrl: 'https://images.pexels.com/photos/1350593/pexels-photo-1350593.jpeg',
    },
    {
      title: 'Premium Pet Insurance',
      description: 'Comprehensive coverage for accidents, illnesses, and preventive care. Peace of mind for pet parents.',
      icon: <Award size={24} />,
      imageUrl: 'https://images.pexels.com/photos/3671300/pexels-photo-3671300.jpeg',
    }
  ], []);

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">What's New at FURK</h2>
          <p className="text-xl text-gray-600">
            Discover our newest services and featured offerings for your beloved pets
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ServiceCard
                title={service.title}
                description={service.description}
                icon={service.icon}
                imageUrl={service.imageUrl}
                onClick={() => alert(`You clicked on ${service.title}`)}
                isImageLoaded={loadedImages[service.imageUrl]}
                onImageLoad={() => handleImageLoad(service.imageUrl)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNewSection;