import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useUser } from '@/hooks/queries/useUsers';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router';
import { useSignIn } from '@/hooks/queries/useAuth';
import type { User } from '@/interfaces/user';
import type { Token } from '@/interfaces/token';

interface AuthContextType {
  // Auth
  user: User;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  handleAuthError: () => void;
  handleForbiddenError: () => void;
  handleNetworkError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isRestoring, setIsRestoring] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const { data: user, isLoading: userLoading } = useUser();
  const { mutateAsync: signInMutation, isPending: signingIn } = useSignIn();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (token && refreshToken) {
      validateToken(token, refreshToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateToken = async (token: string, refreshToken: string) => {
    try {
      const decoded = jwtDecode<Token>(token);
      const decodedRefresh = jwtDecode<Token>(refreshToken);
      if (
        !!decoded.exp &&
        !!decodedRefresh.exp &&
        decoded.exp < Math.floor(Date.now() / 1000) &&
        decodedRefresh.exp < Math.floor(Date.now() / 1000)
      ) {
        localStorage.removeItem('token');
        signOut();
        setRedirectPath('/login');
      } else {
        setRedirectPath('/dashboard');
      }
    } catch (error) {
      console.error(error);
      signOut();
    }
  };

  useEffect(() => {
    if (redirectPath) {
      navigate(redirectPath);
      setRedirectPath(null);
    }
  }, [redirectPath, navigate]);

  const signIn = async (email: string, password: string) => {
    const data = await signInMutation({ email, password });

    localStorage.setItem('access_token', data.token);
    localStorage.setItem('refresh_token', data.refreshToken);
    await queryClient.invalidateQueries({ queryKey: ['user'] });

    const redirectPath =
      localStorage.getItem('post_login_redirect') || '/dashboard';
    localStorage.removeItem('post_login_redirect');
    navigate(redirectPath);
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    queryClient.clear();
    navigate('/login');
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleForbiddenError = () => {
    navigate('/403');
  };

  const handleNetworkError = () => {
    navigate('/500');
  };

  const restoreSession = useCallback(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setIsRestoring(false);
      return;
    }

    queryClient
      .invalidateQueries({ queryKey: ['user'] })
      .then(() => setIsRestoring(false));
  }, [queryClient]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isRestoring || userLoading || signingIn,
        signIn,
        signOut,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        handleAuthError,
        handleForbiddenError,
        handleNetworkError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
