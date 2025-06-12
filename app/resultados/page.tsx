"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ResultadosHeader } from "@/components/ResultadosHeader"
import { VehicleUserInfo } from "@/components/VehicleUserInfo"
import { PlanSelector } from "@/components/PlanSelector"
import { InsuranceComparisonTable } from "@/components/InsuranceComparisonTable"
import { CotizacionService, type Insurer, type VehicleData, type UserData } from "@/services/cotizacionService"

export default function ResultadosPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [expandedInsurers, setExpandedInsurers] = useState<{ [id: string]: boolean }>({})
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<"amplia" | "limitada" | "rc">("amplia")
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")

  const [editableVehicleData, setEditableVehicleData] = useState<VehicleData>({
    marca: "Honda",
    año: "2017",
    modelo: "CRV",
    descripcion: "Elegance 2WD",
  })

  const [editableUserData, setEditableUserData] = useState<UserData>({
    genero: "Femenino",
    fechaNacimiento: "2001-02-01",
    codigoPostal: "07310",
  })

  // Estado para los resultados de cotización
  const [cotizacionResultados, setCotizacionResultados] = useState<any[] | null>(null)
  const [insurers, setInsurers] = useState<Insurer[]>([])

  const cotizacionService = CotizacionService.getInstance()

  // Leer datos del vehículo y usuario reales desde sessionStorage si existen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem("cotizacionResultados")
      if (data) {
        const parsedData = JSON.parse(data)
        setCotizacionResultados(parsedData)
        setInsurers(cotizacionService.getInsurersFromResults(parsedData))
      }
      // Leer datos del vehículo y usuario si existen
      const vehiculo = window.sessionStorage.getItem("cotizadorVehiculo")
      if (vehiculo) {
        setEditableVehicleData(JSON.parse(vehiculo))
      }
      const usuario = window.sessionStorage.getItem("cotizadorUsuario")
      if (usuario) {
        setEditableUserData(JSON.parse(usuario))
      }
    }
  }, [])

  // Sondeo dinámico de resultados en sessionStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const data = window.sessionStorage.getItem("cotizacionResultados")
      if (data) {
        const parsedData = JSON.parse(data)
        setCotizacionResultados(parsedData)
        setInsurers(cotizacionService.getInsurersFromResults(parsedData))
      }
    }, 2000) // cada 2 segundos
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8BC34A]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Si no hay resultados, mostrar mensaje
  if (!cotizacionResultados) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">No hay resultados de cotización</h2>
          <Button onClick={() => router.push("/quotes/new")}>Realizar una cotización</Button>
        </div>
      </DashboardLayout>
    )
  }

  const handleNuevaCotizacion = () => {
    router.push("/cotizador")
  }

  const handleDownloadExcel = () => {
    try {
      cotizacionService.generateExcel(insurers, editableVehicleData, editableUserData)
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error)
      alert("Error al generar el archivo. Inténtalo de nuevo.")
    }
  }

  // Handler para alternar expansión individual
  const handleToggleExpand = (insurerId: string) => {
    setExpandedInsurers(prev => ({
      ...prev,
      [insurerId]: !prev[insurerId]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ResultadosHeader
          onDownloadExcel={handleDownloadExcel}
          onNuevaCotizacion={handleNuevaCotizacion}
        />

        <VehicleUserInfo
          vehicleData={editableVehicleData}
          userData={editableUserData}
        />

        <PlanSelector
          selectedPlan={selectedPlan}
          onPlanChange={setSelectedPlan}
          lowestPrices={{
            amplia: cotizacionService.getLowestPriceAndInsurer(insurers, "amplia"),
            limitada: cotizacionService.getLowestPriceAndInsurer(insurers, "limitada"),
            rc: cotizacionService.getLowestPriceAndInsurer(insurers, "rc"),
          }}
        />

        <InsuranceComparisonTable
          insurers={cotizacionService.sortInsurers(insurers, selectedPlan, sortOrder)}
          selectedPlan={selectedPlan}
          sortOrder={sortOrder}
          expandedInsurers={expandedInsurers}
          onSortOrderChange={setSortOrder}
          onToggleExpand={handleToggleExpand}
        />

        {/* Bottom CTA */}
        <div className="flex justify-center mt-8 mb-4">
          <Button
            className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8 py-2 shadow-md"
            onClick={handleNuevaCotizacion}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Realizar nueva cotización
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
