import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { loginService } from '../../services/auth/auth-service';

const AffiliateNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await loginService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white py-4 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/affiliate/dashboard"
            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
          >
            <img src="/logo_new_small.png" alt="Logo" className="h-8" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-gray-700 hover:text-primary-500 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AffiliateNavbar;
