import { ArrowRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../common/Button';
import { useState, useEffect } from 'react';

const HERO_IMAGE_URL = 'https://images.pexels.com/photos/46024/pexels-photo-46024.jpeg';

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
    <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
      {/* Background Image with loading state */}
      <div 
        className={`absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`} 
        style={{ 
          backgroundImage: `url(${HERO_IMAGE_URL})`,
          backgroundPosition: 'center',
          filter: 'brightness(0.40)'
        }}
      >
        {/* Fallback background color while image loads */}
        <div className={`absolute inset-0 bg-gray-800 transition-opacity duration-500 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`} />
        {/* Additional overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 flex flex-col">
        <motion.div 
          className="text-center text-white max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-cursive text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight sm:text-start text-center">
            Your All-in-One Pet Services Platform
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-10 text-gray-100 leading-relaxed sm:text-start text-center">
            Find and book the best pet services in the Philippines, from grooming to healthcare, all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start mb-12 w-full">
            <Link to="/services" className="flex justify-center sm:justify-start w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight size={20} />}
                className="w-full sm:w-auto"
              >
                Explore Services
              </Button>
            </Link>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="bg-white p-1.5 rounded-xl shadow-2xl max-w-2xl mx-auto sm:mx-0">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3.5 border-0 focus:ring-2 focus:ring-primary-300 focus:outline-none rounded-lg text-gray-900 placeholder:text-gray-400 text-base"
                  placeholder="Search for pet services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-8 rounded-lg ml-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
              >
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