"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface Usuario {
  vapellidoPaterno: string;
  vapellidoMaterno: string;
  dfechaCreacion: string;
  vemail: string;
  iusuarioId: number;
  vnombre: string;
}

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// Crear un valor por defecto para el contexto
const defaultContextValue: AuthContextType = {
  user: null,
  login: async () => {
    throw new Error('AuthProvider no inicializado');
  },
  logout: () => {
    throw new Error('AuthProvider no inicializado');
  },
  isAuthenticated: false,
  isInitialized: false,
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          // Aquí podrías validar el token con el backend si es necesario
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
        authService.removeToken();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ vEmail: email, vPassword: password });
      authService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.usuario));
      setUser(response.usuario);
      setIsAuthenticated(true);
      router.replace('/cotizador');
    } catch (error) {
      console.error('Error durante el login:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.removeToken();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    router.replace('/login');
  };

  // Mostrar skeleton mientras se inicializa la autenticación
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-12 mx-auto mb-6 rounded" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
      isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
