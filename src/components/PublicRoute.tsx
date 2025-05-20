import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null && localStorage.getItem('cognitoAccessToken') !== null;
  const userRole = localStorage.getItem('roleName');

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