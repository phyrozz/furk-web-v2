import { motion } from 'framer-motion';
import Button from '../../common/Button';

const PartnerSection = () => {
  return (
    <section className="py-16 bg-primary-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          {/* Image Column */}
          <motion.div 
            className="w-full md:w-1/2 mb-8 md:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://images.pexels.com/photos/6131005/pexels-photo-6131005.jpeg?auto=compress&cs=tinysrgb&w=1600" 
              alt="Veterinarian with pet" 
              className="rounded-xl shadow-lg w-full h-auto object-cover max-h-96" 
            />
          </motion.div>
          
          {/* Content Column */}
          <motion.div 
            className="w-full md:w-1/2 md:pl-12"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Become a FURK Partner</h2>
            <p className="text-xl text-gray-600 mb-6">
              Join the largest network of pet service providers in the Philippines and grow your business.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Reach thousands of pet owners looking for your services</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Easy-to-use booking and scheduling system</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Receive payments quickly and securely</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Analytics and insights to help your business grow</span>
              </li>
            </ul>
            
            <Button
              variant="primary"
              size="lg"
              onClick={() => alert('Partner application would start here')}
            >
              Apply to Become a Partner
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;