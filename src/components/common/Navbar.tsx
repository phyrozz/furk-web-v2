import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Shield, LayoutDashboard, Bell } from 'lucide-react';
import { loginService } from '../../services/auth/auth-service';
import { motion } from 'framer-motion';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { UserNotificationsService } from '../../services/user-notifications/user-notifications';
import PawLoading from './PawLoading';
import ResizableRightSidebar from './ResizableRightSidebar';
import DateUtils from '../../utils/date-utils';
import { http } from '../../utils/http';
import { UserWallet } from '../../models/user-wallet';
import Button from './Button';
import { Tooltip } from './Tooltip';
import { useGuideTooltip } from '../../providers/GuideTooltip';
import GuideTip from './GuideTooltip';

const userNotificationsService = new UserNotificationsService();

interface Notification {
  id: number;
  title: string;
  description: string;
  service_id?: string;
  modified_at: string;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { tooltipState, setTooltipState } = useGuideTooltip();

  const fetchNotifications = useCallback(async (limit: number, offset: number) => {
    try {
      const response = await userNotificationsService.listUserNotifications(limit, offset);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);

  const fetchUserWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await http.get<{ data: UserWallet }>('/pet-owner-profile/get-user-wallet');
      setUserWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch user wallet:', error);
      setUserWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { items: notifications, loadMore, loading, hasMore } = useLazyLoad<Notification>({
    fetchData: fetchNotifications,
    limit: 10,
    enabled: isAuth && showNotifications,
    dependencies: [isAuth, showNotifications],
  });

  const observer = useRef<IntersectionObserver>();
  const lastNotificationElementRef = useCallback((node: HTMLButtonElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const [navItems, setNavItems] = useState([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Rewards', path: '/rewards' },
  ]);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.service_id) {
      navigate(`/services/${notification.service_id}`);
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await loginService.isAuthenticated();
        setIsAuth(authenticated);
        if (authenticated) {
          setNavItems(prevItems => prevItems.filter(item => item.name !== 'Home'));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchUserWallet();
    }
  }, [isAuth, fetchUserWallet]);

  const renderNotifications = () => (
    <div className="space-y-2">
      {notifications.length > 0 ? (
        notifications.map((notification, index) => (
          <button
            ref={notifications.length === index + 1 ? lastNotificationElementRef : undefined}
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <h4 className="font-medium text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-600">{notification.description}</p>
            <p className="text-right text-xs mt-2 text-gray-600">
              {DateUtils.formatRelativeTime(notification.modified_at)}
            </p>
          </button>
        ))
      ) : !loading ? (
        <div className="p-4 text-gray-600">No notifications</div>
      ) : (
        <div className="p-4 flex justify-center items-center">
          <PawLoading />
        </div>
      )}
    </div>
  );

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 py-4 bg-white ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
            onClick={closeMenu}
          >
            <img src="/logo_new_small.png" alt="Logo" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                  location.pathname === item.path ? 'text-primary-500 font-semibold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {isAuth ? (
              <>
                <Tooltip content="Notifications" position='bottom'>
                  <motion.button
                    onClick={toggleNotifications}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-primary-600 hover:text-primary-700 transition-colors"
                    aria-label="Notifications"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bell size={20} />
                  </motion.button>
                </Tooltip>
                <div className="relative flex flex-row gap-1">
                  <motion.button
                    onClick={toggleProfileMenu}
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
                        {loginService.getUserRole() === 'merchant' && (
                          <Link
                            to="/merchant/dashboard"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <LayoutDashboard size={16} className="mr-2" />
                            Dashboard
                          </Link>
                        )}
                        {loginService.getUserRole() === 'admin' && (
                          <Link
                            to="/admin/merchants"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <Shield size={16} className="mr-2" />
                            Dashboard
                          </Link>
                        )}
                        {/* Condition here looks messy at the moment. Will implement role matrix handling */}
                        {['user', 'merchant'].includes(loginService.getUserRole() || '') && <Link
                          to={loginService.getUserRole() === 'user' ? "/profile" : "/merchant/profile"}
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User size={16} className="mr-2" />
                          Profile
                        </Link>}
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

                  {isLoading && loginService.getUserRole() === 'user' && (
                    <div className="flex items-center justify-center w-10 h-10 overflow-clip">
                      <PawLoading size={32} bounce={false} />
                    </div>
                  )}
                  {!isLoading && loginService.getUserRole() === 'user' && (
                    <GuideTip 
                      content="Welcome to Furk! Let's get started by topping up your balance to access our services"
                      position='bottom' 
                      show={tooltipState.isNewUser}
                      onClose={() => setTooltipState({ ...tooltipState, isNewUser: false })}
                    >  
                      <Tooltip content="Furkredits balance" position="bottom">
                        <Button
                          onClick={
                            () => {
                              setTooltipState({ ...tooltipState, isNewUser: false });
                              navigate('/profile');
                            }
                          }
                          variant="ghost"
                          aria-label="Furkredits balance"
                        >
                          <span className="font-bold">
                            {userWallet?.furkredits?.toFixed(2) ?? 0} <span className="text-xs font-medium">Furkredits</span>
                          </span>
                        </Button>
                      </Tooltip>
                    </GuideTip>
                  )}
                </div>
              </>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Login / Register
                </Link>
              </motion.div>
            )}
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
            isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col space-y-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`font-medium text-gray-700 hover:text-primary-500 transition-colors ${
                  location.pathname === item.path ? 'text-primary-500 font-semibold' : ''
                }`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
            {isAuth ? (
              <>
                <button
                  onClick={toggleNotifications}
                  className="flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors"
                >
                  <Bell size={16} className="mr-2" />
                  Notifications
                </button>
                {loginService.getUserRole() === 'merchant' && (
                  <Link
                    to="/merchant/dashboard"
                    className="flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard size={16} className="mr-2" />
                    Dashboard
                  </Link>
                )}
                {loginService.getUserRole() === 'admin' && (
                  <Link
                    to="/admin/merchants"
                    className="flex items-center font-medium text-gray-700 hover:text-primary-500 transition-colors"
                    onClick={closeMenu}
                  >
                    <Shield size={16} className="mr-2" />
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
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
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 bg-primary-50 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-100 hover:text-primary-800 transition-colors"
                  onClick={closeMenu}
                >
                  <span className="font-bold">
                    {userWallet?.furkredits ?? 0} Furkredits
                  </span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center"
                onClick={closeMenu}
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      <ResizableRightSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        icon={<Bell />}
        initialWidth={400}
        minWidth={300}
        maxWidth={600}
      >
        {renderNotifications()}
      </ResizableRightSidebar>
    </nav>
  );
};

export default Navbar;
