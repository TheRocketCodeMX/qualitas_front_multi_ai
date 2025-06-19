"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

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

  // No renderizar nada hasta que la autenticación esté inicializada
  if (!isInitialized) {
    return null;
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
