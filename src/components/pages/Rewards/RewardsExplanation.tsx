import { motion } from 'framer-motion';
import { BookOpen, GiftIcon, Repeat, CreditCard } from 'lucide-react';

const RewardsExplanation = () => {
  const steps = [
    {
      title: 'Sign Up',
      description: 'Create an account and automatically enroll in the FURK Rewards Program to start earning points.',
      icon: <BookOpen size={32} className="text-primary-500" />,
    },
    {
      title: 'Earn Points',
      description: 'Earn 1 point for every ₱100 spent on services. Get bonus points for bookings, reviews, and referrals.',
      icon: <Repeat size={32} className="text-primary-500" />,
    },
    {
      title: 'Track Progress',
      description: 'Monitor your points balance, tier status, and available rewards through your FURK account.',
      icon: <CreditCard size={32} className="text-primary-500" />,
    },
    {
      title: 'Redeem Rewards',
      description: 'Use your points for discounts on services, free add-ons, exclusive merchandise, and more.',
      icon: <GiftIcon size={32} className="text-primary-500" />,
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Our rewards program is designed to thank you for your loyalty and make pet care more affordable
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className="bg-gray-50 rounded-xl p-6 text-center shadow-sm"
              variants={itemVariants}
            >
              <div className="flex justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 max-w-4xl mx-auto bg-gray-50 rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Ways to Earn Points
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-primary-600 mb-2">Service Bookings</h4>
              <p className="text-gray-700">1 point for every ₱100 spent on services</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-primary-600 mb-2">Service Reviews</h4>
              <p className="text-gray-700">50 points for each verified review</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-primary-600 mb-2">Referrals</h4>
              <p className="text-gray-700">200 points when a friend signs up and books</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-primary-600 mb-2">Special Promotions</h4>
              <p className="text-gray-700">Double or triple points during promotional periods</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardsExplanation;