"use client"

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const publicRoutes = ['/login'];

export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!hasRedirected) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (!isAuthenticated && !publicRoutes.includes(pathname)) {
          router.replace('/login');
          setHasRedirected(true);
        } else if (isAuthenticated && pathname === '/login') {
          router.replace('/cotizador');
          setHasRedirected(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pathname, router, hasRedirected]);

  return { isAuthenticated, isLoading };
}
