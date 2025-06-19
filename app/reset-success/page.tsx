"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { CheckCircle2 } from "lucide-react"

export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="pt-8">
          <div className="flex justify-center mb-8">
            <Logo className="h-12" />
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">¡Contraseña actualizada!</h2>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button asChild className="w-full bg-[#8BC34A] hover:bg-[#7CB342]">
              <Link href="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 