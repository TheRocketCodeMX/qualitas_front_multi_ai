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
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      setIsAuthenticated(true);
      // Aquí podrías hacer una llamada al backend para obtener los datos del usuario
      // usando el token almacenado
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ vEmail: email, vPassword: password });
      authService.setToken(response.token);
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
    setUser(null);
    setIsAuthenticated(false);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
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
