import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut } from 'lucide-react';
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
      className={`furk-topbar fixed top-0 left-0 w-full z-50 transition-all duration-300 py-3 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/affiliate/dashboard"
            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
          >
            <img src="/logo_new_small.png" alt="Furk" className="h-8" />
            <span className="furk-role-label hidden sm:block">Affiliate</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/help"
              className="flex items-center justify-center w-10 h-10 rounded-full text-primary-600 hover:text-primary-700 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={20} />
            </Link>
            <button
              onClick={handleLogout}
              className="furk-nav-link"
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

export default AffiliateNavbar;
