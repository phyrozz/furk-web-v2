import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginService } from '../services/auth/auth-service';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicRoute = ['/login', '/sign-up/merchant', '/sign-up/user', '/reset-password'].includes(location.pathname);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await loginService.isAuthenticated();
      
      if (!isAuthenticated && !isPublicRoute) {
        navigate('/login', { state: { from: location } });
      }
    };

    checkAuth();
  }, [location.pathname]);

  return <>{children}</>;
};

export default AuthWrapper;