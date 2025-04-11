import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'reseller';
}

export function useAuth() {
  const [, setLocation] = useLocation();
  
  const { 
    data, 
    isLoading, 
    isError 
  } = useQuery<{ user: User | undefined }>({ 
    queryKey: ['/api/me'], 
    retry: false 
  });
  
  const user = data?.user;
  const isAuthenticated = !!user;
  
  return {
    user,
    isAdmin: user?.role === 'admin',
    isReseller: user?.role === 'reseller',
    isAuthenticated,
    isLoading
  };
}

export function useRequireAuth(role?: 'admin' | 'reseller') {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      setLocation('/');
      return;
    }
    
    if (role) {
      const hasRole = user?.role === role;
      if (!hasRole) {
        // Redirect to appropriate dashboard
        const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/reseller/dashboard';
        if (location !== redirectPath) {
          setLocation(redirectPath);
        }
      }
    }
  }, [isAuthenticated, isLoading, user, role, location, setLocation]);
  
  return { user, isLoading };
}

export function useRedirectIfAuthenticated() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      // Redirect to appropriate dashboard
      const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/reseller/dashboard';
      setLocation(redirectPath);
    }
  }, [isAuthenticated, isLoading, user, setLocation]);
  
  return { isLoading };
}
