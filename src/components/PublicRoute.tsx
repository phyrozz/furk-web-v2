import { Navigate } from 'react-router-dom';
import { loginService } from '../services/auth/auth-service';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = loginService.isAuthenticated();
  const userRole = localStorage.getItem('roleName');

  // console.log(isAuthenticated);

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