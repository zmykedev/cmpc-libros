import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  return useAuth().isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
