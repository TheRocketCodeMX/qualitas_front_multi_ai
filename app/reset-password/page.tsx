"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/ui/logo"
import { Loader } from "@/components/ui/loader"
import { passwordResetService } from "@/services/passwordResetService"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get("token")

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token no proporcionado")
        setIsLoading(false)
        return
      }

      try {
        const response = await passwordResetService.validateToken(token)
        if (response.success && response.data?.valid) {
          setTokenValid(true)
          setEmail(response.data.email)
        } else {
          setError("El enlace ha expirado o no es válido")
        }
      } catch (error) {
        setError("El enlace ha expirado o no es válido")
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una mayúscula"
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una minúscula"
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número"
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "La contraseña debe contener al menos un carácter especial (!@#$%^&*)"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar contraseña
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      if (!token) throw new Error("Token no proporcionado")
      
      await passwordResetService.resetPassword(token, password)
      toast({
        title: "¡Éxito!",
        description: "Tu contraseña ha sido actualizada correctamente.",
      })
      router.push("/reset-success")
    } catch (error) {
      setError("Error al actualizar la contraseña. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loader fullScreen size="lg" text="Verificando enlace..." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="pt-8">
          <div className="flex justify-center mb-8">
            <Logo className="h-12" />
          </div>

          {!tokenValid ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Enlace inválido</h2>
              <p className="text-gray-600 mb-6">
                {error || "El enlace para restablecer la contraseña no es válido o ha expirado."}
              </p>
              <Button asChild className="w-full bg-[#8BC34A] hover:bg-[#7CB342]">
                <Link href="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold">Crear nueva contraseña</h2>
                  <p className="text-gray-600 mt-2">
                    Por favor, ingresa y confirma tu nueva contraseña para la cuenta {email}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>La contraseña debe contener:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Al menos 8 caracteres</li>
                    <li>Una letra mayúscula</li>
                    <li>Una letra minúscula</li>
                    <li>Un número</li>
                    <li>Un carácter especial (!@#$%^&*)</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full bg-[#8BC34A] hover:bg-[#7CB342]">
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 