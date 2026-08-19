import { useAuth } from '@/contexts/auth';

type Role = 'admin' | 'principal' | 'coordinator' | 'teacher';

// hierarchy of permissions (from highest to lowest)
const roleHierarchy: Record<Role, number> = {
  admin: 4,
  principal: 3,
  coordinator: 2,
  teacher: 1,
};

export function useRole() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (requiredRole: Role): boolean => {
    if (!isAuthenticated || !user?.role) return false;

    const userRoleLevel = roleHierarchy[user.role as Role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    if (!isAuthenticated || !user?.role) return false;
    return roles.includes(user.role as Role);
  };

  const hasExactRole = (role: Role): boolean => {
    if (!isAuthenticated || !user?.role) return false;
    return user.role === role;
  };

  return {
    hasRole,
    hasAnyRole,
    hasExactRole,
    isAdmin: hasExactRole('admin'),
    isPrincipal: hasExactRole('principal'),
    isCoordinator: hasExactRole('coordinator'),
    isTeacher: hasExactRole('teacher'),
  };
}
