import { useAuth } from '@/contexts/auth';
import { useRole } from '@/hooks/useRole';
import { Navigate, Outlet } from 'react-router';

type Role = 'admin' | 'principal' | 'coordinator' | 'teacher';

interface RoleProtectedRouteProps {
  requiredRole?: Role;
  requiredRoles?: Role[];
  allowedRoles?: Role[];
  redirectTo?: string;
}

export default function RoleProtectedRoute({
  requiredRole,
  requiredRoles,
  allowedRoles,
  redirectTo = '/error/403',
}: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole, hasAnyRole } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // check the hierarchy (admin has access to everything the coordinator has, etc)
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  // check multiple roles with hierarchy
  if (requiredRoles && !requiredRoles.some((role) => hasRole(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  // check specific roles (without hierarchy)
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
