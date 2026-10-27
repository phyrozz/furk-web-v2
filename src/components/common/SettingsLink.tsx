import { Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SettingsLink({ onClick }: { onClick?: () => void }) {
  const { pathname } = useLocation();
  return (
    <Link to="/settings" onClick={onClick} aria-label="Settings" title="Settings" aria-current={pathname === '/settings' ? 'page' : undefined} className="furk-nav-link h-10 w-10 shrink-0 justify-center !px-0">
      <Settings size={20} aria-hidden="true" />
    </Link>
  );
}
