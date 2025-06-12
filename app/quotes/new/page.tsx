"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { QuoteRequest } from "@/types"
import { Car, Home, Heart, Shield } from "lucide-react"

export default function NewQuotePage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<QuoteRequest & {
    vehicleInfo: QuoteRequest["vehicleInfo"] & { description?: string }
    personalInfo: QuoteRequest["personalInfo"] & { birthdate?: string; postalCode?: string }
  }>({
    insuranceType: "auto",
    personalInfo: {
      age: 0,
      gender: "M",
      location: "cdmx",
      currentInsurer: "",
      birthdate: "",
      postalCode: "",
    },
    vehicleInfo: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      value: 0,
      description: "",
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const insuranceTypes = [
    { value: "auto", label: "Seguro de Auto", icon: Car, description: "Protección para tu vehículo" },
    { value: "home", label: "Seguro de Casa", icon: Home, description: "Protección para tu hogar" },
    { value: "life", label: "Seguro de Vida", icon: Heart, description: "Protección para tu familia" },
    { value: "health", label: "Seguro de Salud", icon: Shield, description: "Protección médica" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[DEBUG] handleSubmit ejecutado");
    setIsSubmitting(true)
    setError("")

    // Lista de aseguradoras y sus endpoints
    const insurers = [
      {
        id: "hdi",
        name: "HDI",
        endpoint: "http://localhost:8080/cotizacion-api/api/cotizacion/1",
      },
      // Puedes agregar más aseguradoras aquí
    ]

    // Validar que los datos requeridos estén completos y sean válidos
    const { brand, model, year, value, description } = formData.vehicleInfo
    const { gender, age, location, birthdate, postalCode } = formData.personalInfo
    if (
      !brand ||
      !model ||
      !description ||
      !gender ||
      !location ||
      !birthdate ||
      !postalCode ||
      age < 18 ||
      year < 1990 ||
      value <= 0
    ) {
      console.log("[DEBUG] Validación bloqueada", { brand, model, year, value, description, gender, age, location, birthdate, postalCode });
      setError("Por favor completa todos los campos obligatorios y asegúrate de que los valores sean válidos antes de cotizar.")
      setIsSubmitting(false)
      return
    }

    // Mapear los datos del formulario al formato esperado por el endpoint
    const requestBody = {
      vBrand: brand,
      vSubBrand: model,
      vModel: String(year),
      vDescription: description,
      vValorVehiculo: value,
      vSexoPersona: gender === "M" ? "MASCULINO" : "FEMENINO",
      vFechaNacimientoPersona: birthdate,
      vCodigoPostalPersona: postalCode,
    }

    console.log("[DEBUG] Enviando cotización", requestBody)

    try {
      // Ejecutar todas las solicitudes en paralelo
      const results = await Promise.all(
        insurers.map(async (insurer) => {
          try {
            const res = await fetch(insurer.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            })
            if (!res.ok) {
              let errorMessage = `Error en ${insurer.name}: ${res.status} ${res.statusText}`;
              try {
                const errorData = await res.json();
                if (errorData && errorData.message) {
                  errorMessage = errorData.message;
                }
              } catch {}
              if (!errorMessage || errorMessage === "Failed to fetch") {
                errorMessage = "Error consultando datos";
              }
              return { insurer: insurer.name, data: { success: false, message: errorMessage } }
            }
            const data = await res.json()
            return { insurer: insurer.name, data }
          } catch (err) {
            // Guardar error como data: { success: false, message: ... }
            let errorMessage = err instanceof Error ? err.message : "Error desconocido";
            if (!errorMessage || errorMessage === "Failed to fetch") {
              errorMessage = "Error consultando datos";
            }
            return { insurer: insurer.name, data: { success: false, message: errorMessage } }
          }
        })
      )

      // Guardar resultados en sessionStorage
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("cotizacionResultados", JSON.stringify(results))
      }
      router.push("/resultados")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la cotización")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de Seguro</CardTitle>
        <CardDescription>Selecciona el tipo de seguro que deseas cotizar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insuranceTypes.map((type) => (
            <div
              key={type.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.insuranceType === type.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setFormData({ ...formData, insuranceType: type.value as any })}
            >
              <div className="flex items-center space-x-3">
                <type.icon
                  className={`h-8 w-8 ${formData.insuranceType === type.value ? "text-blue-600" : "text-gray-400"}`}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>Proporciona tus datos para obtener cotizaciones precisas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="100"
              value={formData.personalInfo.age || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, age: Number.parseInt(e.target.value) || 0 },
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select
              value={formData.personalInfo.gender}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, gender: value as "M" | "F" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación (Estado)</Label>
          <Select
            value={formData.personalInfo.location}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, location: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cdmx">Ciudad de México</SelectItem>
              <SelectItem value="jalisco">Jalisco</SelectItem>
              <SelectItem value="nuevo-leon">Nuevo León</SelectItem>
              <SelectItem value="puebla">Puebla</SelectItem>
              <SelectItem value="veracruz">Veracruz</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthdate">Fecha de nacimiento</Label>
          <Input
            id="birthdate"
            type="date"
            value={formData.personalInfo.birthdate || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, birthdate: e.target.value },
              })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Código Postal</Label>
          <Input
            id="postalCode"
            type="text"
            maxLength={5}
            pattern="[0-9]{5}"
            value={formData.personalInfo.postalCode || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, postalCode: e.target.value },
              })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentInsurer">Aseguradora Actual (Opcional)</Label>
          <Select
            value={formData.personalInfo.currentInsurer || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, currentInsurer: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu aseguradora actual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Ninguna</SelectItem>
              <SelectItem value="GNP">GNP</SelectItem>
              <SelectItem value="Chubb">Chubb</SelectItem>
              <SelectItem value="Mapfre">Mapfre</SelectItem>
              <SelectItem value="HDI">HDI</SelectItem>
              <SelectItem value="AXA">AXA</SelectItem>
              <SelectItem value="other">Otra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => {
    console.log("[DEBUG] Renderizando paso 3 (formulario de vehículo)");
    if (formData.insuranceType === "auto") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Información del Vehículo</CardTitle>
            <CardDescription>Detalles de tu automóvil para cotización precisa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={formData.vehicleInfo?.brand || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      vehicleInfo: { ...formData.vehicleInfo!, brand: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toyota">Toyota</SelectItem>
                    <SelectItem value="nissan">Nissan</SelectItem>
                    <SelectItem value="volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="chevrolet">Chevrolet</SelectItem>
                    <SelectItem value="ford">Ford</SelectItem>
                    <SelectItem value="honda">Honda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.vehicleInfo?.model || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicleInfo: { ...formData.vehicleInfo!, model: e.target.value },
                    })
                  }
                  placeholder="Ej: Corolla, Sentra, Jetta"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicleInfo?.year || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicleInfo: { ...formData.vehicleInfo!, year: Number.parseInt(e.target.value) || 0 },
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor del Vehículo (MXN)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={formData.vehicleInfo?.value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicleInfo: { ...formData.vehicleInfo!, value: Number.parseInt(e.target.value) || 0 },
                    })
                  }
                  placeholder="250000"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.vehicleInfo?.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicleInfo: { ...formData.vehicleInfo!, description: e.target.value },
                  })
                }
                placeholder="Ej: SDRIVE 18I 5P L3 1.5L TURBO ABS BA 2 AC R17 AUT 5 OCUP"
                required
              />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
          <CardDescription>Detalles específicos para tu tipo de seguro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea id="notes" placeholder="Información adicional que consideres relevante..." rows={4} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Cotización</h1>
          <p className="text-gray-600 mt-1">
            Completa el formulario para obtener cotizaciones de múltiples aseguradoras
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            {currentStep < 3 ? (
              <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} onClick={() => console.log("[DEBUG] Click en submit")}>
                {isSubmitting ? "Procesando..." : "Obtener Cotizaciones"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
