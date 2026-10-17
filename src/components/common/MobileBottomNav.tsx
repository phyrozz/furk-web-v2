import { Gift, Home, LogIn, MessageCircle, Search, Store, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  isAuthenticated: boolean;
}

const MobileBottomNav = ({ isAuthenticated }: MobileBottomNavProps) => {
  const location = useLocation();
  const items = isAuthenticated
    ? [
        { label: 'Services', path: '/services', icon: Search },
        { label: 'Merchants', path: '/merchants', icon: Store },
        { label: 'Rewards', path: '/rewards', icon: Gift },
        { label: 'Chat', path: '/chat', icon: MessageCircle },
        { label: 'Profile', path: '/profile', icon: User },
      ]
    : [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Services', path: '/services', icon: Search },
        { label: 'Merchants', path: '/merchants', icon: Store },
        { label: 'Rewards', path: '/rewards', icon: Gift },
        { label: 'Sign in', path: '/login', icon: LogIn },
      ];

  const isItemActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[35] px-3 pt-2 lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[1.4rem] border border-white/80 bg-white/90 p-1.5 shadow-[0_12px_32px_rgba(79,56,35,0.18)] backdrop-blur-xl">
        {items.map(({ label, path, icon: Icon }) => {
          const active = isItemActive(path);

          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors active:scale-95 ${
                active
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-500 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
