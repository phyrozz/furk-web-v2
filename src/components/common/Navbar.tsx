import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, LayoutDashboard, Bell, HelpCircle, Lightbulb, Coins } from 'lucide-react';
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
import { UserProfileService } from '../../services/profile/user-profile-service';
import MobileBottomNav from './MobileBottomNav';
import { useTutorialsMenu } from './TutorialsMenuContext';
import { getTutorialAudienceForPage } from '../../data/tutorials';

const userNotificationsService = new UserNotificationsService();

interface Notification {
  id: number;
  title: string;
  description: string;
  service_id?: string;
  modified_at: string;
}

interface NavbarProps {
  isAuthenticated?: boolean;
  userRole?: string | null;
}

interface NavbarProfile {
  image_url?: string;
}

const Navbar = ({ isAuthenticated, userRole }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAuth, setIsAuth] = useState(isAuthenticated ?? false);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('/default_profile.png');
  const { tooltipState, setTooltipState } = useGuideTooltip();
  const { isExpanded: isTutorialMenuExpanded, setIsExpanded: setIsTutorialMenuExpanded, mobileTriggerRef } = useTutorialsMenu();
  const userProfileService = new UserProfileService();
  const cdnUrl = import.meta.env.VITE_CDN_URL || '';

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

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsProfileImageLoading(true);
      const response = await userProfileService.getUserDetails();
      const profile = response.data as NavbarProfile;

      if (!profile?.image_url) {
        setProfileImageUrl('/default_profile.png');
        return;
      }

      if (profile.image_url.startsWith('http')) {
        setProfileImageUrl(profile.image_url);
        return;
      }

      setProfileImageUrl(`${cdnUrl}/${profile.image_url.replace(/^\/+/, '')}`);
    } catch (error) {
      console.error('Failed to fetch profile image:', error);
      setProfileImageUrl('/default_profile.png');
    } finally {
      setIsProfileImageLoading(false);
    }
  }, [cdnUrl]);

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
    { name: 'Merchants', path: '/merchants' },
    { name: 'Rewards', path: '/rewards' },
  ]);
  const location = useLocation();
  const navigate = useNavigate();

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

  const resolvedRole = userRole ?? loginService.getUserRole();
  const hasTutorials = Boolean(getTutorialAudienceForPage(location.pathname, isAuth, resolvedRole));
  const formattedFurkredits = userWallet?.furkredits?.toFixed(2) ?? '0.00';

  useEffect(() => {
    if (typeof isAuthenticated !== 'undefined') {
      setIsAuth(isAuthenticated);
      setNavItems(prevItems => {
        const hasHome = prevItems.some(item => item.name === 'Home');
        if (isAuthenticated) {
          return prevItems.filter(item => item.name !== 'Home');
        }
        if (!hasHome) {
          return [{ name: 'Home', path: '/' }, ...prevItems];
        }
        return prevItems;
      });
      return;
    }

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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuth) {
      fetchUserWallet();
      fetchUserProfile();
    }
  }, [isAuth, fetchUserWallet, fetchUserProfile]);

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
    <>
    <nav
      className={`furk-topbar fixed top-0 left-0 w-full z-40 transition-all duration-300 py-3 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="hidden items-center space-x-2 text-primary-500 transition-colors hover:text-primary-600 lg:flex"
          >
            <img src="/logo_new_small.png" alt="Logo" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                className={`furk-nav-link ${
                  location.pathname === item.path ? 'text-primary-500 font-semibold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Chat link for authenticated users */}
            {isAuth && (
              <Link
                to="/chat"
                className={`furk-nav-link ${
                  location.pathname === '/chat' ? 'text-primary-500 font-semibold' : ''
                }`}
              >
                Chat
              </Link>
            )}
            {isAuth ? (
              <>
                <Tooltip content="Help" position="bottom">
                  <Link
                    to="/help"
                    className="flex items-center justify-center w-10 h-10 rounded-full text-primary-600 hover:text-primary-700 transition-colors"
                    aria-label="Help"
                  >
                    <HelpCircle size={20} />
                  </Link>
                </Tooltip>
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
                  {isLoading && resolvedRole === 'user' && (
                    <div className="flex items-center justify-center w-10 h-10 overflow-clip">
                      <PawLoading size={32} bounce={false} />
                    </div>
                  )}
                  {!isLoading && resolvedRole === 'user' && (
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
                            {formattedFurkredits} <span className="text-xs font-medium">Furkredits</span>
                          </span>
                        </Button>
                      </Tooltip>
                    </GuideTip>
                  )}

                  <motion.button
                    onClick={toggleProfileMenu}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors overflow-hidden"
                    aria-label="Profile menu"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProfileImageLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <PawLoading size={26} bounce={false} />
                      </div>
                    ) : (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => setProfileImageUrl('/default_profile.png')}
                      />
                    )}
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
                        {resolvedRole === 'merchant' && (
                          <Link
                            to="/merchant/dashboard"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <LayoutDashboard size={16} className="mr-2" />
                            Dashboard
                          </Link>
                        )}
                        {resolvedRole === 'admin' && (
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
                        {['user', 'merchant'].includes(resolvedRole || '') && <Link
                          to={resolvedRole === 'user' ? "/profile" : "/merchant/profile"}
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
                </div>
              </>
            ) : (
              <>
                <Tooltip content="Help" position="bottom">
                  <Link
                    to="/help"
                    className="flex items-center justify-center w-10 h-10 rounded-full text-primary-600 hover:text-primary-700 transition-colors"
                    aria-label="Help"
                  >
                    <HelpCircle size={20} />
                  </Link>
                </Tooltip>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/login"
                    className="bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-bold transition-colors"
                  >
                    Login / Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Link
              to="/help"
              aria-label="Help"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary-700 transition-colors hover:bg-primary-50"
            >
              <HelpCircle size={20} />
            </Link>
            {hasTutorials && (
              <motion.button
                ref={mobileTriggerRef}
                type="button"
                onClick={() => setIsTutorialMenuExpanded(!isTutorialMenuExpanded)}
                aria-label="Tips & Tricks"
                aria-controls="floating-tutorial-topics"
                aria-expanded={isTutorialMenuExpanded}
                title="Tips & Tricks"
                className="inline-flex h-10 min-w-[2.5rem] items-center justify-center gap-1.5 rounded-full px-2 text-primary-700 transition-colors hover:bg-primary-50"
                whileTap={{ scale: 0.94 }}
              >
                <Lightbulb size={20} />
                <span className="hidden text-xs font-semibold min-[360px]:inline">Tips</span>
              </motion.button>
            )}
            {isAuth ? (
              <>
                <motion.button
                  onClick={toggleNotifications}
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary-700 transition-colors hover:bg-primary-50"
                  whileTap={{ scale: 0.94 }}
                >
                  <Bell size={20} />
                </motion.button>
                {resolvedRole === 'user' && (
                  <GuideTip
                    content="Welcome to Furk! Let's get started by topping up your balance to access our services"
                    position="bottom"
                    show={tooltipState.isNewUser}
                    onClose={() => setTooltipState({ ...tooltipState, isNewUser: false })}
                  >
                    <Tooltip content="Furkredits balance" position="bottom">
                      <Link
                        to="/profile"
                        aria-label={`Furkredits balance: ${formattedFurkredits}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 text-sm font-bold text-primary-800 transition-colors hover:bg-primary-100"
                        onClick={() => setTooltipState({ ...tooltipState, isNewUser: false })}
                      >
                        <Coins size={16} aria-hidden="true" />
                        <span>{isLoading ? '...' : formattedFurkredits}</span>
                        <span className="hidden text-[10px] font-semibold min-[360px]:inline">Furkredits</span>
                      </Link>
                    </Tooltip>
                  </GuideTip>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-primary-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
              >
                Sign in
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
    {(!isAuth || resolvedRole === 'user') && <MobileBottomNav isAuthenticated={isAuth} />}
    </>
  );
};

export default Navbar;
