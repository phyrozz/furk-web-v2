import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react';
import { loginService } from '../../services/auth/auth-service';
import { motion } from 'framer-motion';

const MerchantNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('merchantNavbarCollapsed') === 'true');
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const merchantStatus = localStorage.getItem('merchantStatus');
  const canAccessMerchantProfile = merchantStatus && merchantStatus !== 'unverified';
  const sidebarWidth = isCollapsed ? '6rem' : '18rem';

  const navItems = [
    { name: 'Dashboard', path: '/merchant/dashboard', icon: LayoutDashboard },
    { name: 'Services', path: '/merchant/manage-services', icon: ClipboardList },
    { name: 'Categories', path: '/merchant/service-categories', icon: FileText },
    { name: 'Bookings', path: '/merchant/bookings', icon: Calendar },
    { name: 'Payouts', path: '/merchant/payouts', icon: DollarSign },
    { name: 'Chat', path: '/merchant/chat', icon: MessageCircle },
  ];

  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await loginService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('merchantNavbarCollapsed', String(isCollapsed));
    document.documentElement.style.setProperty('--merchant-navbar-width', sidebarWidth);
  }, [isCollapsed, sidebarWidth]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <aside
        className="hidden lg:flex fixed left-0 top-0 z-50 h-screen flex-col bg-white border-r border-gray-200 shadow-sm transition-[width] duration-300"
        style={{ width: sidebarWidth }}
      >
        <div className={`px-5 py-4 border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link
              to="/merchant/dashboard"
              className="flex items-center text-primary-500 hover:text-primary-600 transition-colors"
              onClick={closeMenu}
              aria-label="Merchant dashboard"
            >
              <img
                src="/logo_new_small.png"
                alt="Furk"
                className={isCollapsed ? 'h-9 w-9 object-contain' : 'h-7 w-auto max-w-[104px] object-contain'}
              />
            </Link>
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-xl py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500 transition-colors ${
                  location.pathname === item.path ? 'bg-primary-50 text-primary-600 font-semibold' : ''
                } ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
                title={isCollapsed ? item.name : undefined}
                aria-label={item.name}
              >
                <item.icon size={18} className={`${isCollapsed ? '' : 'mr-3'} shrink-0`} />
                <span className={isCollapsed ? 'hidden' : 'block'}>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <Link
              to="/help"
              className={`flex items-center rounded-xl py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500 transition-colors ${
                isCollapsed ? 'justify-center px-2' : 'px-4'
              }`}
              aria-label="Help"
              title={isCollapsed ? 'Help' : undefined}
            >
              <HelpCircle size={18} className={`${isCollapsed ? '' : 'mr-3'} shrink-0`} />
              <span className={isCollapsed ? 'hidden' : 'block'}>Help</span>
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="relative">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu((prev) => !prev);
              }}
              className={`flex w-full items-center rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3'
              }`}
              aria-label="Profile menu"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              title={isCollapsed ? 'Account' : undefined}
            >
              <span className="flex items-center">
                <User size={18} className={isCollapsed ? '' : 'mr-3'} />
                <span className={isCollapsed ? 'hidden' : 'block'}>Account</span>
              </span>
              <Menu size={18} className={isCollapsed ? 'hidden' : 'block'} />
            </motion.button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute bottom-14 left-0 w-full rounded-lg bg-white py-1 shadow-lg z-50 border border-gray-100 ${isCollapsed ? 'min-w-56' : ''}`}
                >
                  {canAccessMerchantProfile && (
                    <Link
                      to="/merchant/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                  )}
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
      </aside>

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex fixed left-[4.5rem] top-4 z-50 rounded-lg p-2 text-gray-500 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-primary-600 transition-colors"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white py-4 lg:hidden ${scrolled ? 'shadow-lg' : ''}`}
      >
        <div className="container mx-auto px-4 lg:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link
              to="/merchant/dashboard"
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
              onClick={closeMenu}
            >
              <img src="/logo_new_small.png" alt="Logo" className="h-8" />
            </Link>

            <button
              className="lg:hidden text-gray-700 hover:text-primary-500 transition-colors"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isOpen ? <PanelLeftClose size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div
            className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? 'max-h-[70vh] opacity-100 mt-4 overflow-y-auto' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col space-y-4 py-4 pb-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                    location.pathname === item.path ? 'text-primary-500 font-semibold' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              ))}
              <Link
                to="/help"
                className={`flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                  location.pathname === '/help' ? 'text-primary-500 font-semibold' : ''
                }`}
                onClick={closeMenu}
              >
                <HelpCircle size={16} className="mr-2" />
                Help
              </Link>
              {canAccessMerchantProfile && (
                <Link
                  to="/merchant/profile"
                  className="flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors"
                  onClick={closeMenu}
                >
                  <User size={16} className="mr-2" />
                  Profile
                </Link>
              )}
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
    </>
  );
};

export default MerchantNavbar;
