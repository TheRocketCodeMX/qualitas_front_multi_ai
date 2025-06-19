"use client"

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const publicRoutes = ['/login'];

export function useAuthGuard() {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        router.replace('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.replace('/cotizador');
      }
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  return { 
    isAuthenticated,
    isLoading: !isInitialized
  };
}
