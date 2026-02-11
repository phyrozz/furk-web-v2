import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';

const PartnerSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image Column */}
          <div 
            className="w-full md:w-1/2"
          >
            <img 
              src="https://images.pexels.com/photos/6131005/pexels-photo-6131005.jpeg?auto=compress&cs=tinysrgb&w=1600" 
              alt="Veterinarian with pet" 
              className="rounded-xl shadow-xl w-full h-auto object-cover max-h-96" 
            />
          </div>
          
          {/* Content Column */}
          <div 
            className="w-full md:w-1/2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">Become a FURK Partner</h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
              Join the network of pet service providers in the Philippines and grow your business.
            </p>
            
            <ul className="space-y-4 mb-10">
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-3 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 leading-relaxed">Reach thousands of pet owners looking for your services</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-3 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 leading-relaxed">Easy-to-use booking and scheduling system</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-3 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 leading-relaxed">Receive payments quickly and securely</span>
              </li>
              <li className="flex items-start">
                <div className="h-6 w-6 text-primary-500 mr-3 mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 leading-relaxed">Analytics and insights to help your business grow</span>
              </li>
            </ul>
            
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/sign-up/merchant')}
            >
              Apply to Become a Partner
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;