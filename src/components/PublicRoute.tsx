import { Navigate } from 'react-router-dom';
import { loginService } from '../services/auth/auth-service';
import { useEffect, useState } from 'react';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userRole = localStorage.getItem('roleName');

  // console.log(isAuthenticated);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await loginService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    // Redirect authenticated users to their appropriate dashboard/home
    if (userRole === 'merchant') {
      return <Navigate to="/merchant/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;