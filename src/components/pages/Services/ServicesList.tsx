import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Scissors, Stethoscope, Dog, GraduationCap, Shield, Truck, Heart, Building, Flower as FlowerSad, MapPin } from 'lucide-react';
import Button from '../../common/Button';

interface Service {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
  subservices: string[];
  imageUrl: string;
}

interface ServicesListProps {
  onFindMerchant: (serviceId: number) => void;
}

const ServicesList: React.FC<ServicesListProps> = ({ onFindMerchant }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const selectedServiceRef = useRef<HTMLDivElement>(null);

  const onServiceSelect = (serviceId: number) => {
    onFindMerchant(serviceId);
  }

  useEffect(() => {
    if (selectedService && selectedServiceRef.current) {
      selectedServiceRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [selectedService]);
  
  const services: Service[] = [
    {
      id: 1,
      title: 'Pet Boarding',
      icon: <Home size={24} />,
      description: `Safe and comfortable accommodations for your pets while you are away. Our boarding facilities provide 24/7 care, feeding, exercise, and monitoring.`,
      subservices: ['Standard Boarding', 'Luxury Suites', 'Long-term Boarding', 'Daycare'],
      imageUrl: 'https://images.pexels.com/photos/6131007/pexels-photo-6131007.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 2,
      title: 'Pet Grooming',
      icon: <Scissors size={24} />,
      description: 'Professional grooming services for dogs and cats of all breeds. Our skilled groomers provide bathing, haircuts, nail trimming, ear cleaning, and more.',
      subservices: ['Full Grooming Package', 'Bath & Brush', 'Nail Trimming', 'Teeth Cleaning', 'Mobile Grooming'],
      imageUrl: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 3,
      title: 'Vet Services',
      icon: <Stethoscope size={24} />,
      description: 'Comprehensive veterinary care for all your pet health needs. Our network of qualified veterinarians provides preventative care, treatments, surgeries, and emergency services.',
      subservices: ['Emergency Room', 'Vaccines', 'Vitamins & Nutrition', 'ID Tracker Injection', 'Surgery', 'Dental Care'],
      imageUrl: 'https://images.pexels.com/photos/6235508/pexels-photo-6235508.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 4,
      title: 'Pet Sitting/Walking',
      icon: <Dog size={24} />,
      description: 'Reliable pet sitters and dog walkers who will care for your pets in your home or take them for exercise and playtime. Perfect for busy pet owners.',
      subservices: ['Daily Dog Walking', 'In-home Pet Sitting', 'Pet Visits', 'Overnight Care'],
      imageUrl: 'https://images.pexels.com/photos/5731824/pexels-photo-5731824.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 5,
      title: 'Pet Training',
      icon: <GraduationCap size={24} />,
      description: 'Expert training services to help your pets learn good behavior and fun tricks. Our trainers use positive reinforcement techniques for effective results.',
      subservices: ['Basic Obedience', 'Behavior Modification', 'Puppy Training', 'Advanced Commands', 'Group Classes'],
      imageUrl: 'https://images.pexels.com/photos/6131152/pexels-photo-6131152.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 6,
      title: 'Pet Insurance',
      icon: <Shield size={24} />,
      description: 'Protect your pets and your finances with comprehensive pet insurance plans. Coverage for accidents, illnesses, routine care, and more.',
      subservices: ['Accident Coverage', 'Illness Coverage', 'Wellness Plans', 'Emergency Services', 'Prescription Coverage'],
      imageUrl: 'https://images.pexels.com/photos/1350593/pexels-photo-1350593.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 7,
      title: 'Pet Transport',
      icon: <Truck size={24} />,
      description: 'Safe and stress-free transportation services for your pets, whether it is local trips to the vet or international relocations. We handle all the logistics.',
      subservices: ['Local Transport', 'Domestic Relocations', 'International Transport', 'Airport Pickup/Dropoff'],
      imageUrl: 'https://images.pexels.com/photos/982865/pexels-photo-982865.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 8,
      title: 'Pet Breeding',
      icon: <Heart size={24} />,
      description: 'Ethical breeding services from registered and responsible breeders. Health testing, genetic screening, and proper care for mother and puppies/kittens.',
      subservices: ['Purebred Breeding', 'Genetic Health Testing', 'Pregnancy Care', 'Puppy/Kitten Socialization'],
      imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 9,
      title: 'Pet Orphanage',
      icon: <Building size={24} />,
      description: 'Support and care for abandoned and homeless pets. Our partner shelters provide food, shelter, medical care, and help in finding forever homes.',
      subservices: ['Adoption Services', 'Foster Programs', 'Rehabilitation', 'Spay/Neuter Programs', 'Donation Options'],
      imageUrl: 'https://images.pexels.com/photos/1633522/pexels-photo-1633522.jpeg?auto=compress&cs=tinysrgb&w=1600'
    },
    {
      id: 10,
      title: 'Pet Events',
      icon: <FlowerSad size={24} />,
      description: 'Organize memorable pet events and celebrations. We provide planning services for pet birthdays, adoption celebrations, pet competitions, and social gatherings.',
      subservices: ['Birthday Parties', 'Pet Competitions', 'Social Meetups', 'Adoption Celebrations', 'Photo Sessions', 'Pet Funerals'],
      imageUrl: 'https://images.pexels.com/photos/7788657/pexels-photo-7788657.jpeg?auto=compress&cs=tinysrgb&w=1600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-cursive md:text-3xl font-bold text-gray-800 mb-4">
            Comprehensive Services for All Your Pet's Needs
          </h2>
          <p className="text-gray-600 text-lg">
            From everyday care to specialized services, we connect you with trusted merchants for every aspect of your pet's wellbeing.
          </p>
        </div>

        {/* Service Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                selectedService?.id === service.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedService(service)}
            >
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {service.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Service Details */}
        {selectedService && (
          <motion.div 
            ref={selectedServiceRef}
            className="mt-12 bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="h-64 md:h-full bg-gray-300 overflow-hidden">
                  <img
                    src={selectedService.imageUrl}
                    alt={selectedService.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:w-2/3 p-6 md:p-8">
                <div className="flex items-center mb-4">
                  <div className="mr-3 text-primary-500">
                    {selectedService.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedService.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  {selectedService.description}
                </p>
                
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    Available Services:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedService.subservices.map((subservice, index) => (
                      <li key={index} className="flex items-start">
                        <div className="text-primary-500 mr-2 mt-1 h-4 w-4 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{subservice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center">
                  <Button
                    variant="primary"
                    onClick={() => onServiceSelect(selectedService.id)}
                  >
                    Find Merchants
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ServicesList;