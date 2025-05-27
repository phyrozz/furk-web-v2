import { Navigate, useLocation } from 'react-router-dom';
import { loginService } from '../services/auth/auth-service';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'merchant' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  
  // You can get this from your auth context or state management
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

  if (!isAuthenticated) {
    // Redirect to login page while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate page if role doesn't match
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;