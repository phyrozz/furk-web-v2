import { Navigate } from 'react-router-dom';

const RoleRedirect = () => {
  const userRole = localStorage.getItem('roleName');

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  switch (userRole) {
    case 'merchant':
      return <Navigate to="/merchant/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/merchants" replace />;
    case 'affiliate':
      return <Navigate to="/affiliate/dashboard" replace />;
    case 'user':
      return <Navigate to="/services" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RoleRedirect;
