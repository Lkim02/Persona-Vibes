import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Render the protected component if authenticated
  return children;
};

export default PrivateRoute;
