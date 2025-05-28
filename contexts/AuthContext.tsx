"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, LoginRequest } from "@/types"

interface AuthContextType {
  user: User | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

// Create a default context value to avoid the "must be used within a Provider" error
const defaultContextValue: AuthContextType = {
  user: null,
  login: async () => {
    console.error("AuthProvider not initialized")
  },
  logout: () => {
    console.error("AuthProvider not initialized")
  },
  isAuthenticated: false,
  isLoading: true,
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export const useAuth = () => {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un token guardado al inicializar
    try {
      if (typeof window !== "undefined") {
        const savedUser = localStorage.getItem("currentUser")
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
          } catch (error) {
            localStorage.removeItem("currentUser")
          }
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true)
    try {
      // Simulación de API call - en un entorno real, esto sería una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 800)) // Simular delay de red

      const userData: User = {
        id: "user-123",
        email: credentials.email,
        name: credentials.email.split("@")[0],
        token: "jwt-token-simulated-123456789",
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(userData))
      }
      setUser(userData)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user?.token,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
