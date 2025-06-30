import { motion } from 'framer-motion';
import { CheckCircle, Shield, Award, Clock } from 'lucide-react';

const WhyFurkSection = () => {
  const benefits = [
    {
      icon: <CheckCircle size={32} className="text-primary-500" />,
      title: 'Verified Merchants',
      description: 'All merchants on FURK undergo a thorough verification process to ensure quality and reliability.'
    },
    {
      icon: <Shield size={32} className="text-primary-500" />,
      title: 'Secure Booking & Payment',
      description: 'Book and pay for services with confidence using our secure platform with multiple payment options.'
    },
    {
      icon: <Award size={32} className="text-primary-500" />,
      title: 'Rewards Program',
      description: 'Earn points with every booking and redeem them for discounts, free services, and exclusive offers.'
    },
    {
      icon: <Clock size={32} className="text-primary-500" />,
      title: '24/7 Support',
      description: 'Our dedicated support team is available around the clock to assist with any questions or concerns.'
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.h2 
            className="text-3xl font-cursive font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Why Choose FURK
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We're dedicated to making pet care easy, reliable, and rewarding
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
              variants={itemVariants}
            >
              <div className="flex justify-center mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyFurkSection;