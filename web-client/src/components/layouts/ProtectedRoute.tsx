import { useAuth } from '@/contexts/auth';
import { Navigate, Outlet } from 'react-router';
import { Loading } from '../ui/Loading';

export default function ProtectedRoute({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) return <Navigate to="/error/401" replace />;

  return children ? <>{children}</> : <Outlet />;
}
