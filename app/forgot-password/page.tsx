"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await passwordResetService.requestReset(email)
      setSuccess(true)
      toast({
        title: "Solicitud enviada",
        description: "Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.",
      })
    } catch (error) {
      setError("Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loader fullScreen size="lg" text="Procesando solicitud..." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="pt-8">
          <div className="flex justify-center mb-8">
            <Logo className="h-12" />
          </div>

          {success ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Revisa tu correo</h2>
              <p className="text-gray-600 mb-6">
                Si el correo electrónico existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.
              </p>
              <Button asChild className="w-full bg-[#8BC34A] hover:bg-[#7CB342]">
                <Link href="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold">¿Olvidaste tu contraseña?</h2>
                  <p className="text-gray-600 mt-2">
                    Ingresa tu correo electrónico y te enviaremos instrucciones para restablecerla.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-[#8BC34A] hover:bg-[#7CB342]">
                  Enviar instrucciones
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 