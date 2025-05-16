import { motion } from 'framer-motion';
import { Scissors, Stethoscope, Truck, Heart, Gift } from 'lucide-react';
import Button from '../../common/Button';

interface RewardItemProps {
  title: string;
  pointsCost: number;
  icon: React.ReactNode;
  description: string;
}

const RewardItem: React.FC<RewardItemProps> = ({ title, pointsCost, icon, description }) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-primary-500 mr-3">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <div className="font-medium text-secondary-600">
            {pointsCost} points
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`You would redeem ${title} here`)}
          >
            Redeem
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const RewardsRedemption = () => {
  const rewardItems = [
    {
      title: 'Free Basic Grooming',
      pointsCost: 500,
      icon: <Scissors size={24} />,
      description: 'Redeem for a complimentary basic grooming session for your pet.'
    },
    {
      title: 'Vet Checkup Discount',
      pointsCost: 750,
      icon: <Stethoscope size={24} />,
      description: '50% off a routine veterinary checkup at participating clinics.'
    },
    {
      title: 'Free Pet Transport',
      pointsCost: 600,
      icon: <Truck size={24} />,
      description: 'One free local pet transport service to any destination within the city.'
    },
    {
      title: 'Premium Pet Food',
      pointsCost: 450,
      icon: <Heart size={24} />,
      description: 'A bag of premium pet food from selected partner brands.'
    },
    {
      title: 'Pet Toy Bundle',
      pointsCost: 350,
      icon: <Gift size={24} />,
      description: 'A bundle of interactive toys for your pet to enjoy.'
    },
    {
      title: 'Birthday Pet Party',
      pointsCost: 1200,
      icon: <Gift size={24} />,
      description: 'Special celebration package for your pet\'s birthday with treats and accessories.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Redeem Your Rewards
          </h2>
          <p className="text-xl text-gray-600">
            Use your earned points for these exciting rewards and special benefits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rewardItems.map((item, index) => (
            <RewardItem
              key={index}
              title={item.title}
              pointsCost={item.pointsCost}
              icon={item.icon}
              description={item.description}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => alert('You would see all rewards here')}
          >
            View All Rewards
          </Button>
          <p className="mt-4 text-gray-600">
            New rewards and redemption options are added regularly. Check back often!
          </p>
        </div>
      </div>
    </section>
  );
};

export default RewardsRedemption;