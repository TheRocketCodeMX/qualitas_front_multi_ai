"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Car, Shield, DollarSign, Umbrella, Plus, Download } from "lucide-react"
import Image from "next/image"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResultadosPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [expandedInsurer, setExpandedInsurer] = useState<string | null>("chubb")
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<"amplia" | "limitada" | "rc">("amplia")
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")
  const [isEditMode, setIsEditMode] = useState(false)

  const [editableVehicleData, setEditableVehicleData] = useState({
    marca: "Honda",
    año: "2017",
    modelo: "CRV",
    descripcion: "Elegance 2WD",
  })

  const [editableUserData, setEditableUserData] = useState({
    genero: "Femenino",
    fechaNacimiento: "2001-02-01",
    telefono: "5512345678",
    codigoPostal: "07310",
  })

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

  const vehicleTypes = [{ id: "auto", label: "Auto/SUV", icon: Car, disabled: false }]

  const insurers = [
    {
      id: "chubb",
      name: "CHUBB",
      logo: "/images/chubb-logo.png",
      prices: {
        amplia: "$9,123",
        limitada: "$5,123",
        rc: "$4,123",
      },
      deductible: "10% del valor comercial",
      medicalExpenses: "$200,000",
      isHighlighted: true,
    },
    {
      id: "mapfre",
      name: "MAPFRE",
      logo: "/images/mapfre-logo.png",
      prices: {
        amplia: "$8,651",
        limitada: "$4,890",
        rc: "$3,890",
      },
      deductible: "10% del valor comercial",
      medicalExpenses: "$40,000 por ocupante",
      isHighlighted: false,
    },
    {
      id: "gnp",
      name: "GNP",
      logo: "/images/gnp-logo.png",
      prices: {
        amplia: "$8,454",
        limitada: "$4,750",
        rc: "$3,750",
      },
      deductible: "10% del valor comercial",
      medicalExpenses: "$40,000 por ocupante",
      isHighlighted: false,
    },
    {
      id: "hdi",
      name: "HDI",
      logo: "/images/hdi-logo.png",
      prices: {
        amplia: "$8,320",
        limitada: "$4,650",
        rc: "$3,650",
      },
      deductible: "5% del valor comercial",
      medicalExpenses: "$50,000 por ocupante",
      isHighlighted: false,
    },
    {
      id: "axa",
      name: "AXA",
      logo: "/images/axa-logo.png",
      prices: {
        amplia: "$8,890",
        limitada: "$4,990",
        rc: "$3,990",
      },
      deductible: "10% del valor comercial",
      medicalExpenses: "$100,000",
      isHighlighted: false,
    },
  ]

  const toggleExpanded = (insurerId: string) => {
    setExpandedInsurer(expandedInsurer === insurerId ? null : insurerId)
  }

  const handleNuevaCotizacion = () => {
    router.push("/cotizador")
  }

  const handleDownloadExcel = () => {
    try {
      // Datos del vehículo y usuario
      const vehicleInfo = "Honda - 2017 - CRV - Elegance 2WD"
      const userInfo = "María Hernández - Femenino - 01/02/2001 - 5512345678 - maria@mail.com - 07310"

      // Preparar datos para Excel
      const excelData = []

      // Encabezados
      const headers = [
        "Vehículo",
        "Usuario",
        "Aseguradora",
        "Prima Anual",
        "Deducible Robo Total",
        "Gastos Médicos",
        "Robo Total",
        "Responsabilidad Civil - Daños a Bienes",
        "Responsabilidad Civil - Daños Corporales",
        "Fianza Legal",
        "Daños Materiales",
        "Servicios de Asistencia",
      ]

      excelData.push(headers)

      // Datos de cada aseguradora
      insurers.forEach((insurer) => {
        const row = [
          vehicleInfo,
          userInfo,
          insurer.name,
          insurer.prices[selectedPlan],
          insurer.deductible,
          insurer.medicalExpenses,
          "Valor comercial al momento del siniestro",
          "Hasta $1,500,000 MXN",
          "Hasta $3,000,000 MXN",
          "Incluida hasta $50,000 MXN",
          "Valor comercial - Deducible 5%",
          "Grúa, corriente, gasolina, llanta, asistencia legal",
        ]
        excelData.push(row)
      })

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 35 }, // Vehículo
        { wch: 50 }, // Usuario
        { wch: 15 }, // Aseguradora
        { wch: 12 }, // Prima Anual
        { wch: 20 }, // Deducible
        { wch: 20 }, // Gastos Médicos
        { wch: 25 }, // Robo Total
        { wch: 25 }, // RC Bienes
        { wch: 25 }, // RC Corporales
        { wch: 20 }, // Fianza
        { wch: 25 }, // Daños Materiales
        { wch: 35 }, // Asistencia
      ]
      ws["!cols"] = colWidths

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Cotización")

      // Generar archivo y descargar
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `cotizacion_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error)
      alert("Error al generar el archivo. Inténtalo de nuevo.")
    }
  }

  const getSortedInsurers = () => {
    if (sortOrder === "default") {
      return insurers
    }

    const sorted = [...insurers].sort((a, b) => {
      // Convert price strings to numbers for comparison
      const priceA = Number.parseFloat(a.prices[selectedPlan].replace(/[$,]/g, ""))
      const priceB = Number.parseFloat(b.prices[selectedPlan].replace(/[$,]/g, ""))

      if (sortOrder === "asc") {
        return priceA - priceB
      } else {
        return priceB - priceA
      }
    })

    return sorted
  }

  const renderCoverageDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-6 bg-gray-50 rounded-lg">
      {/* Robo total */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Robo total</h4>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Ampara el robo total del vehículo asegurado.</p>
          <p>
            <strong>Suma asegurada:</strong> Valor comercial al momento del siniestro
          </p>
          <p>
            <strong>Deducible:</strong> 10% del valor comercial
          </p>
        </div>
      </div>

      {/* Responsabilidad civil */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Umbrella className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Responsabilidad civil por daños a terceros</h4>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Cubre los daños que el asegurado cause a terceros en sus bienes o personas, al conducir el vehículo.</p>
          <p>
            <strong>Daños a bienes de terceros:</strong> Hasta $1,500,000 MXN
          </p>
          <p>
            <strong>Daños corporales a terceros:</strong> Hasta $3,000,000 MXN
          </p>
          <p>
            <strong>Fianza legal:</strong> Incluida hasta $50,000 MXN
          </p>
        </div>
      </div>

      {/* Servicios de asistencia */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Servicios de asistencia (vial y en viajes)</h4>
        </div>
        <div className="text-sm text-gray-600">
          <p>Servicios adicionales incluidos:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Arrastre con grúa hasta 100 km.</li>
            <li>Paso de corriente.</li>
            <li>Envío de gasolina (costo de gasolina no incluido).</li>
            <li>Cambio de llanta.</li>
            <li>Asistencia legal en caso de accidente (abogados, gestoría).</li>
          </ul>
        </div>
      </div>

      {/* Daños materiales */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Daños materiales</h4>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            Cubre los daños físicos al vehículo asegurado a consecuencia de colisiones, vuelcos, fenómenos naturales
            (inundaciones, granizo), vandalismo, entre otros.
          </p>
          <p>
            <strong>Suma asegurada:</strong> Valor comercial
          </p>
          <p>
            <strong>Deducible:</strong> 5% del valor comercial
          </p>
        </div>
      </div>

      {/* Gastos médicos */}
      <div className="space-y-3 md:col-span-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">Gastos médicos a ocupantes</h4>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            Ampara el pago de gastos médicos por lesiones corporales sufridas por el conductor y ocupantes del vehículo
            asegurado, derivadas de un accidente automovilístico.
          </p>
          <p>
            <strong>Suma asegurada por persona:</strong> $100,000 MXN
          </p>
          <p>
            <strong>Límite por evento:</strong> $500,000 MXN
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizador manual</h1>
            <p className="text-gray-600 mt-1">Lorem ipsum dolor sit amet consectetur.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A] hover:text-white px-6 py-2"
              onClick={handleDownloadExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
            <Button
              className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-6 py-2 shadow-sm"
              onClick={handleNuevaCotizacion}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva cotización
            </Button>
          </div>
        </div>

        {/* Vehicle Type Tabs */}
        <div className="w-full">
          <div className="grid w-full grid-cols-1 bg-gray-100 h-12">
            {vehicleTypes.map((type) => (
              <div
                key={type.id}
                className={`flex items-center justify-center space-x-2 h-12 ${
                  type.id === "auto"
                    ? "bg-white text-[#8BC34A] border-b-2 border-[#8BC34A]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span className="text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle and User Info */}
        {isEditMode ? (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar información</h3>

                {/* Vehicle Data */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Datos del vehículo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-marca" className="text-sm font-medium text-gray-700">
                        Marca <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-marca"
                        value={editableVehicleData.marca}
                        onChange={(e) => setEditableVehicleData({ ...editableVehicleData, marca: e.target.value })}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-año" className="text-sm font-medium text-gray-700">
                        Año <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-año"
                        value={editableVehicleData.año}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^\d*$/.test(value) && value.length <= 4) {
                            setEditableVehicleData({ ...editableVehicleData, año: value })
                          }
                        }}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        maxLength={4}
                        pattern="[0-9]{4}"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-modelo" className="text-sm font-medium text-gray-700">
                        Modelo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-modelo"
                        value={editableVehicleData.modelo}
                        onChange={(e) => setEditableVehicleData({ ...editableVehicleData, modelo: e.target.value })}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-descripcion" className="text-sm font-medium text-gray-700">
                        Descripción <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-descripcion"
                        value={editableVehicleData.descripcion}
                        onChange={(e) =>
                          setEditableVehicleData({ ...editableVehicleData, descripcion: e.target.value })
                        }
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* User Data */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Datos del usuario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-genero" className="text-sm font-medium text-gray-700">
                        Género <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={editableUserData.genero}
                        onValueChange={(value) => setEditableUserData({ ...editableUserData, genero: value })}
                        required
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-fecha" className="text-sm font-medium text-gray-700">
                        Fecha de nacimiento <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-fecha"
                        type="date"
                        value={editableUserData.fechaNacimiento}
                        onChange={(e) => setEditableUserData({ ...editableUserData, fechaNacimiento: e.target.value })}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-telefono" className="text-sm font-medium text-gray-700">
                        Teléfono <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-telefono"
                        value={editableUserData.telefono}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^\d*$/.test(value) && value.length <= 10) {
                            setEditableUserData({ ...editableUserData, telefono: value })
                          }
                        }}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cp" className="text-sm font-medium text-gray-700">
                        Código postal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-cp"
                        value={editableUserData.codigoPostal}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^\d*$/.test(value) && value.length <= 5) {
                            setEditableUserData({ ...editableUserData, codigoPostal: value })
                          }
                        }}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        maxLength={5}
                        pattern="[0-9]{5}"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="border-gray-300 text-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      // Validate required fields
                      if (
                        !editableVehicleData.marca ||
                        !editableVehicleData.año ||
                        !editableVehicleData.modelo ||
                        !editableVehicleData.descripcion ||
                        !editableUserData.genero ||
                        !editableUserData.fechaNacimiento ||
                        !editableUserData.telefono ||
                        !editableUserData.codigoPostal
                      ) {
                        alert("Por favor, completa todos los campos obligatorios.")
                        return
                      }

                      if (editableUserData.codigoPostal.length !== 5) {
                        alert("El código postal debe tener exactamente 5 dígitos.")
                        return
                      }

                      if (editableUserData.telefono.length !== 10) {
                        alert("El teléfono debe tener exactamente 10 dígitos.")
                        return
                      }

                      setIsEditMode(false)
                    }}
                    className="bg-[#8BC34A] hover:bg-[#7CB342] text-white"
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900">
                    {editableVehicleData.marca} - {editableVehicleData.año} - {editableVehicleData.modelo} -{" "}
                    {editableVehicleData.descripcion}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    {editableUserData.genero} - {editableUserData.fechaNacimiento} - {editableUserData.telefono} -{" "}
                    {editableUserData.codigoPostal}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#8BC34A] border-[#8BC34A]"
                  onClick={() => setIsEditMode(true)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Select defaultValue="anual">
              <SelectTrigger className="w-full border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">Plan anual</SelectItem>
                <SelectItem value="semestral">Plan semestral</SelectItem>
                <SelectItem value="mensual">Plan mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-3 flex">
            <div
              className={`flex-1 text-center p-4 rounded-l-lg cursor-pointer transition-all ${
                selectedPlan === "amplia"
                  ? "bg-[#8BC34A] text-white"
                  : "bg-white border-t border-b border-l border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedPlan("amplia")}
            >
              <div className="text-base font-medium">Amplia</div>
              <div className="text-xl font-bold mt-1">$9,123</div>
            </div>
            <div
              className={`flex-1 text-center p-4 cursor-pointer transition-all ${
                selectedPlan === "limitada"
                  ? "bg-[#8BC34A] text-white"
                  : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedPlan("limitada")}
            >
              <div className="text-base font-medium">Limitada</div>
              <div className="text-xl font-bold mt-1">$5,123</div>
            </div>
            <div
              className={`flex-1 text-center p-4 rounded-r-lg cursor-pointer transition-all ${
                selectedPlan === "rc"
                  ? "bg-[#8BC34A] text-white"
                  : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedPlan("rc")}
            >
              <div className="text-base font-medium">Responsabilidad civil</div>
              <div className="text-xl font-bold mt-1">$4,123</div>
            </div>
          </div>
        </div>

        {/* Insurance Comparison Table */}
        <div className="space-y-4">
          {/* Header with Sort Filter */}
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600 px-4 flex-1">
              <div>Aseguradora</div>
              <div>Prima anual</div>
              <div>Deducible robo total</div>
              <div>Gastos médicos</div>
              <div>Coberturas</div>
            </div>
            <div className="ml-4">
              <Select value={sortOrder} onValueChange={(value: "default" | "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger className="w-48 border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                  <SelectValue placeholder="Ordenar por precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Por defecto</SelectItem>
                  <SelectItem value="asc">Menor a mayor precio</SelectItem>
                  <SelectItem value="desc">Mayor a menor precio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Insurance Cards */}
          {getSortedInsurers().map((insurer) => (
            <div key={insurer.id}>
              <Card className={`border ${insurer.isHighlighted ? "border-[#8BC34A] bg-[#F8FFF8]" : "border-gray-200"}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="font-medium text-gray-900">
                      <div className="h-10 relative">
                        <Image
                          src={insurer.logo || "/placeholder.svg"}
                          alt={`Logo de ${insurer.name}`}
                          fill
                          style={{ objectFit: "contain", objectPosition: "left" }}
                        />
                      </div>
                    </div>
                    <div className="font-bold text-lg">{insurer.prices[selectedPlan]}</div>
                    <div className="text-gray-600">{insurer.deductible}</div>
                    <div className="text-gray-600">{insurer.medicalExpenses}</div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#8BC34A] border-[#8BC34A]"
                        onClick={() => toggleExpanded(insurer.id)}
                      >
                        Coberturas
                        {expandedInsurer === insurer.id ? (
                          <ChevronUp className="w-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 w-4 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expanded Coverage Details */}
              {expandedInsurer === insurer.id && renderCoverageDetails()}
            </div>
          ))}
        </div>

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
