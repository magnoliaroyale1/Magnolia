import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'clinic' | 'admin' | 'professional')[];
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['client', 'clinic', 'admin'],
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isClinic, isClient, isProfessional } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-olive" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (user && allowedRoles.length > 0) {
    const hasAccess = 
      (isAdmin && allowedRoles.includes('admin')) ||
      (isClinic && allowedRoles.includes('clinic')) ||
      (isClient && allowedRoles.includes('client')) ||
      (isProfessional && allowedRoles.includes('professional'));
    
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  if (user && !user.emailVerified && !isAdmin) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};