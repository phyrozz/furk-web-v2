import { motion } from 'framer-motion';

interface TierProps {
  title: string;
  points: string;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
}

const Tier: React.FC<TierProps> = ({ title, points, color, bgColor, borderColor, benefits }) => {
  return (
    <motion.div 
      className={`${bgColor} ${borderColor} border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`${color} p-6 text-center`}>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-90 mb-4">MEMBERSHIP TIER</p>
        <div className="text-lg">
          <span className="opacity-80">Required Points: </span>
          <span className="font-semibold">{points}</span>
        </div>
      </div>
      <div className="p-6 bg-white">
        <h4 className="font-semibold mb-4 text-gray-800">Benefits:</h4>
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start">
              <div className={`${color} mr-2 mt-1 h-4 w-4 flex-shrink-0`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const RewardsTiers = () => {
  const tiers = [
    {
      title: 'Bronze',
      points: '0-500',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      benefits: [
        'Basic earning rate: 1 point per 100 Furkredits',
        'Access to standard rewards',
        'Birthday bonus: 100 points',
        'Monthly newsletter with exclusive offers'
      ]
    },
    {
      title: 'Silver',
      points: '501-1,500',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      benefits: [
        '10% bonus points on all bookings',
        'Priority booking for popular services',
        'Free service upgrade once per quarter',
        'Exclusive Silver member promotions',
        'All Bronze benefits included'
      ]
    },
    {
      title: 'Gold',
      points: '1,501-3,000',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      benefits: [
        '20% bonus points on all bookings',
        'Free cancellation on bookings',
        'Dedicated customer service line',
        'One free standard grooming per year',
        'All Silver benefits included'
      ]
    },
    {
      title: 'Platinum',
      points: '3,001+',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-300',
      benefits: [
        '30% bonus points on all bookings',
        'Premium service upgrades automatically',
        'VIP access to new services and features',
        'Free premium pet check-up annually',
        'Exclusive events and workshops',
        'All Gold benefits included'
      ]
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-cursive font-bold text-gray-800 mb-4">
            Membership Tiers
          </h2>
          <p className="text-xl text-gray-600">
            Unlock greater benefits as you earn more points and advance through our membership tiers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tiers.map((tier, index) => (
            <Tier
              key={index}
              title={tier.title}
              points={tier.points}
              color={tier.color}
              bgColor={tier.bgColor}
              borderColor={tier.borderColor}
              benefits={tier.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RewardsTiers;