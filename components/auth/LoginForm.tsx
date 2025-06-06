"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

export default function LoginForm() {
  const [email, setEmail] = useState("usuario@ejemplo.com")
  const [password, setPassword] = useState("contraseña123")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await auth.login({ email, password })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything on the server
  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Te damos la bienvenida!</h1>
            <p className="text-gray-600">Inicia sesión con tus datos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A] pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-300"
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Recuérdame
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#8BC34A] hover:bg-[#7CB342] text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando..." : "Ingresar"}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-[#8BC34A] hover:text-[#7CB342] text-sm font-medium">
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
