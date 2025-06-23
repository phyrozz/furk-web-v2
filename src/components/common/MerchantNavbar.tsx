import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint as Paw, Menu, X, LogOut, User, Package, FileText, Bell, Calendar } from 'lucide-react';
import { loginService } from '../../services/auth/auth-service';
import { motion } from 'framer-motion';

const MerchantNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await loginService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/merchant/dashboard', icon: Package },
    { name: 'Services', path: '/merchant/manage-services', icon: FileText },
    { name: 'Bookings', path: '/merchant/bookings', icon: Calendar },
    // { name: 'Notifications', path: '/merchant/notifications', icon: Bell },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white py-4 ${
        scrolled
          ? 'shadow-md'
          : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/merchant/dashboard"
            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
            onClick={closeMenu}
          >
            {/* <Paw size={28} className="text-primary-500" />
            <span className="text-2xl font-bold">FURK</span> */}
            <img src="/logo_new_small.png" alt="Logo" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-2 font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary-500 font-semibold'
                    : ''
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="relative">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProfileMenu();
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                aria-label="Profile menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User size={20} />
              </motion.button>
              
              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                  >
                    <Link
                      to="/merchant/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-primary-500 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isOpen
              ? 'max-h-60 opacity-100 mt-4'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col space-y-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-2 font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary-500 font-semibold'
                    : ''
                }`}
                onClick={closeMenu}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
            <Link
              to="/merchant/profile"
              className="flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors"
              onClick={closeMenu}
            >
              <User size={16} className="mr-2" />
              Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="flex items-center w-full font-medium text-gray-700 hover:text-primary-500 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MerchantNavbar;