import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loginService } from '../services/auth/auth-service';

interface AuthWrapperProps {
  children: React.ReactNode;
  onAuthStatusChange: (isAuthenticated: boolean) => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, onAuthStatusChange }) => {
  // const navigate = useNavigate();
  const location = useLocation();
  // const isPublicRoute = ['/login', '/sign-up/merchant', '/sign-up/user', '/reset-password'].includes(location.pathname);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await loginService.isAuthenticated();
      onAuthStatusChange(isAuthenticated);

      // if (!isAuthenticated && !isPublicRoute) {
      //   navigate('/login', { state: { from: location } });
      // }
    };

    checkAuth();
  }, [location]); // Changed to full location object to detect all route changes

  return <>{children}</>;
};

export default AuthWrapper;