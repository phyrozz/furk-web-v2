import { ArrowRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../common/Button';
import { useState, useEffect } from 'react';

const HERO_IMAGE_URL = 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1600';

const HeroSection = () => {
  const [searchInput, setSearchInput] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Preload the hero image
    const img = new Image();
    img.src = HERO_IMAGE_URL;
    img.onload = () => setImageLoaded(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/services?search=${searchInput}`);
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Image with loading state */}
      <div 
        className={`absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`} 
        style={{ 
          backgroundImage: `url(${HERO_IMAGE_URL})`,
          backgroundPosition: 'center',
          filter: 'brightness(0.6)'
        }}
      >
        {/* Fallback background color while image loads */}
        <div className={`absolute inset-0 bg-gray-800 transition-opacity duration-500 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`} />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-center">
        <motion.div 
          className="text-center text-white max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Your One-Stop Shop for All Pet Needs
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100">
            Find and book the best pet services in the Philippines, from grooming to healthcare, all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link to="/services">
              <Button 
                variant="primary" 
                size="lg"
                icon={<ArrowRight size={20} />}
              >
                Explore Services
              </Button>
            </Link>
            {/* <Button 
              variant="outline" 
              size="lg"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:bg-opacity-30"
            >
              Find a Vet Near You
            </Button> */}
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="bg-white p-2 rounded-lg shadow-lg max-w-2xl mx-auto">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border-0 focus:ring-0 focus:outline-none rounded-lg text-black"
                  placeholder="Search for pet services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-6 rounded-lg ml-2 transition-colors">
                Search
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;