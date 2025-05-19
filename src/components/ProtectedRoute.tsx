import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'merchant' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  
  // You can get this from your auth context or state management
  const isAuthenticated = localStorage.getItem('token') !== null && localStorage.getItem('authToken') !== null;
  const userRole = localStorage.getItem('userRole');

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