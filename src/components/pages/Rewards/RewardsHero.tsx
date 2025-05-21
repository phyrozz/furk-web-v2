import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import Button from '../../common/Button';

const RewardsHero = () => {
  return (
    <section className="bg-gradient-to-r from-secondary-600 to-primary-600 text-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white text-primary-500 mb-6"
          >
            <Award size={48} />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            FURK Rewards Program
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 opacity-90"
          >
            Earn points with every booking and enjoy exclusive benefits and rewards
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center"
          >
            <Button 
              variant="accent"
              size="lg"
              onClick={() => alert('Sign up for rewards would start here')}
            >
              Join the Rewards Program
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RewardsHero;