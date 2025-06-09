"use client"

import { useState, useEffect } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"

// Definir vehicleTypes para evitar error de variable no definida
const vehicleTypes = [
  { id: "auto", label: "Auto/SUV", icon: Car, disabled: false },
  // Puedes agregar más tipos si lo necesitas
]

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
    codigoPostal: "07310",
  })

  const [marcas, setMarcas] = useState<string[]>([])
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(false)
  const [marcaError, setMarcaError] = useState("")

  const [modelos, setModelos] = useState<string[]>([])
  const [isLoadingModelos, setIsLoadingModelos] = useState(false)
  const [modeloError, setModeloError] = useState("")

  const [descripciones, setDescripciones] = useState<string[]>([])
  const [isLoadingDescripciones, setIsLoadingDescripciones] = useState(false)
  const [descripcionError, setDescripcionError] = useState("")

  // Estado para los resultados de cotización
  const [cotizacionResultados, setCotizacionResultados] = useState<any[] | null>(null)

  // Estado para la cobertura seleccionada por aseguradora expandida
  const [selectedCoverageByInsurer, setSelectedCoverageByInsurer] = useState<Record<string, string>>({})

  // Leer datos del vehículo y usuario reales desde sessionStorage si existen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = window.sessionStorage.getItem("cotizacionResultados")
      if (data) {
        setCotizacionResultados(JSON.parse(data))
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
        setCotizacionResultados(JSON.parse(data))
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

  // Mapear los resultados a la estructura de aseguradoras para mostrar dinámicamente
  const insurers = cotizacionResultados.map((res) => {
    if (res.loading) {
      return {
        id: res.insurer.toLowerCase(),
        name: res.insurer,
        logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
        isLoading: true,
        isError: false,
      }
    }
    // Si la respuesta tiene success: false, mostrar mensaje de error
    if (res.data && res.data.success === false) {
      return {
        id: res.insurer.toLowerCase(),
        name: res.insurer,
        logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
        error: res.data.message || "Datos no disponibles para esta aseguradora",
        isError: true,
      }
    }
    // Adaptar el mapeo según la estructura real de tu respuesta para HDI
    let resultado = res.data?.resultado?.[0] || {}
    let isHDI = res.insurer.toLowerCase() === "hdi"
    let prices, deductible, medicalExpenses, coveragesRaw
    if (isHDI) {
      // Para HDI: PREMIUM = Amplia, AMPLIA = Limitada, LIMITADA = RC
      prices = {
        amplia: resultado.PREMIUM?.dPrecioTotal ? `$${resultado.PREMIUM.dPrecioTotal}` : "-",
        limitada: resultado.AMPLIA?.dPrecioTotal ? `$${resultado.AMPLIA.dPrecioTotal}` : "-",
        rc: resultado.LIMITADA?.dPrecioTotal ? `$${resultado.LIMITADA.dPrecioTotal}` : "-",
      }
      deductible = resultado.PREMIUM?.iDanoVehiculo !== undefined ? `${resultado.PREMIUM.iDanoVehiculo}%` : "-"
      medicalExpenses = resultado.PREMIUM?.dGastosMedicos || "-"
      coveragesRaw = {
        amplia: resultado.PREMIUM || {},
        limitada: resultado.AMPLIA || {},
        rc: resultado.LIMITADA || {},
      }
    } else {
      // Default: mantener el mapeo anterior
      prices = {
        amplia: resultado.AMPLIA?.dPrecioTotal ? `$${resultado.AMPLIA.dPrecioTotal}` : "-",
        limitada: resultado.LIMITADA?.dPrecioTotal ? `$${resultado.LIMITADA.dPrecioTotal}` : "-",
        rc: resultado.PREMIUM?.dPrecioTotal ? `$${resultado.PREMIUM.dPrecioTotal}` : "-",
      }
      deductible = resultado.AMPLIA?.deductible || "-"
      medicalExpenses = resultado.AMPLIA?.dGastosMedicos || "-"
      coveragesRaw = {
        amplia: resultado.AMPLIA || {},
        limitada: resultado.LIMITADA || {},
        rc: resultado.PREMIUM || {},
      }
    }
    return {
      id: res.insurer.toLowerCase(),
      name: res.insurer,
      logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
      prices,
      deductible,
      medicalExpenses,
      coveragesRaw, // Guardar el objeto de coberturas crudo
      isHighlighted: false,
      isError: false,
    }
  })

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
          insurer.prices?.[selectedPlan] ?? "-",
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

  // Ordenar aseguradoras por precio del plan seleccionado (las que tienen error van al final)
  function getSortedInsurers() {
    return insurers.slice().sort((a, b) => {
      // Si alguno tiene error, lo manda al final
      if (a.isError && !b.isError) return 1
      if (!a.isError && b.isError) return -1
      if (a.isError && b.isError) return 0
      // Ambos tienen prices
      const priceA =
        a.prices && a.prices[selectedPlan]
          ? Number.parseFloat(a.prices[selectedPlan].replace(/[$,]/g, ""))
          : Number.POSITIVE_INFINITY
      const priceB =
        b.prices && b.prices[selectedPlan]
          ? Number.parseFloat(b.prices[selectedPlan].replace(/[$,]/g, ""))
          : Number.POSITIVE_INFINITY
      return priceA - priceB
    })
  }

  // Utilidad para transformar claves a formato legible
  function humanizeKey(key: string) {
    // Quitar prefijos comunes y separar camelCase o snake_case
    return key
      .replace(/^([A-Z])/, (m) => m.toUpperCase())
      .replace(/^([DVBI])/, "") // Quitar prefijos tipo D, V, B, I
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\b([a-z])/g, (m) => m.toUpperCase())
  }

  // Renderizado visual mejorado de detalles de cobertura
const renderCoverageDetails = (coverageObj: any) => {
  const formatMoneda = (valor: number | string) =>
    valor ? parseFloat(valor as string).toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "-"

  const formatPlazo = (plazo: string) => (plazo.toUpperCase() === "ANUAL" ? "1 año" : plazo)

  const formatIncluido = (valor: number | boolean) => {
    if (typeof valor === "boolean") return valor ? "Incluido" : "No incluido"
    return valor > 0 ? "Incluido" : "No incluido"
  }

  const formatFallecimiento = (valor: number | string) => {
    const num = parseFloat(valor as string)
    return num < 1000 ? `${num}%` : formatMoneda(num)
  }

  const getLabelClass = (val: boolean) =>
    val ? "text-green-600 font-semibold" : "text-red-600 font-semibold"

  if (!coverageObj || Object.keys(coverageObj).length === 0) {
    return <div className="text-gray-500">No hay datos disponibles para esta cobertura.</div>
  }

  return (
    <div className="w-full px-4 mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la cobertura seleccionada</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Cotización Clave</p>
          <p className="text-gray-900 font-medium">{coverageObj.iCotizacionClave}</p>
        </div>
        <div>
          <p className="text-gray-500">Nombre del Seguro</p>
          <p className="text-gray-900 font-medium">{coverageObj.vNombreSeguro}</p>
        </div>
        <div>
          <p className="text-gray-500">Cobertura</p>
          <p className="text-gray-900">{coverageObj.vNombreCobertura}</p>
        </div>
        <div>
          <p className="text-gray-500">Precio Total</p>
          <p className="font-bold text-[#8BC34A]">{formatMoneda(coverageObj.dPrecioTotal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Plazo</p>
          <p className="text-gray-900">{formatPlazo(coverageObj.vPlazoCobertura)}</p>
        </div>
        <div>
          <p className="text-gray-500">Daños a Terceros</p>
          <p className="text-gray-900">{formatMoneda(coverageObj.dDanosTerceros)}</p>
        </div>
        <div>
          <p className="text-gray-500">Robo Total</p>
          <p className="text-gray-900">{formatIncluido(coverageObj.iRoboTotal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Robo Parcial</p>
          <p className="text-gray-900">{formatIncluido(coverageObj.iRoboParcial)}</p>
        </div>
        <div>
          <p className="text-gray-500">Gastos Médicos</p>
          <p className="text-gray-900">{formatMoneda(coverageObj.dGastosMedicos)}</p>
        </div>
        <div>
          <p className="text-gray-500">Fallecimiento</p>
          <p className="text-gray-900">{formatFallecimiento(coverageObj.dFallecimiento)}</p>
        </div>
        <div>
          <p className="text-gray-500">Defensa Legal</p>
          <p className={getLabelClass(coverageObj.bDefensaLegal === "true" || coverageObj.bDefensaLegal === true)}>
            {coverageObj.bDefensaLegal === "true" || coverageObj.bDefensaLegal === true ? "Sí" : "No"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Asistencia Vial</p>
          <p className={getLabelClass(coverageObj.bAsistencialVialCarretera === "true" || coverageObj.bAsistencialVialCarretera === true)}>
            {coverageObj.bAsistencialVialCarretera === "true" || coverageObj.bAsistencialVialCarretera === true ? "Sí" : "No"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Daños al Vehículo</p>
          <p className="text-gray-900">{formatIncluido(coverageObj.iDanoVehiculo)}</p>
        </div>
      </div>
    </div>
  )
}


  const fetchMarcas = async (año: string) => {
    if (!/^\d{4}$/.test(año)) {
      return
    }

    setIsLoadingMarcas(true)
    setMarcaError("")

    try {
      const username = "Proteg@apitherocketcode.com"
      const password = "11ulaIWhR874O564"
      const credentials = btoa(`${username}:${password}`)

      const response = await fetch(
        `https://api.catalogos.therocketcode.com/api/v1/catalogs/qualitas/brands-by-model?model=${año}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const marcasData: string[] = await response.json()

      // Validate that we received an array
      if (!Array.isArray(marcasData)) {
        throw new Error("Formato de respuesta inválido")
      }

      setMarcas(marcasData)
    } catch (error) {
      console.error("Error fetching marcas:", error)

      // For development/testing, provide mock data if API fails
      const mockMarcas = ["Honda", "Toyota", "Nissan", "Volkswagen", "Chevrolet", "Ford"]
      setMarcas(mockMarcas)
      setMarcaError("Usando datos de prueba (API no disponible)")
    } finally {
      setIsLoadingMarcas(false)
    }
  }

  const fetchModelos = async (año: string, marca: string) => {
    if (!/^\d{4}$/.test(año) || !marca) {
      return
    }

    setIsLoadingModelos(true)
    setModeloError("")

    try {
      const username = "Proteg@apitherocketcode.com"
      const password = "11ulaIWhR874O564"
      const credentials = btoa(`${username}:${password}`)

      const response = await fetch(
        `https://api.catalogos.therocketcode.com/api/v1/catalogs/qualitas/subbrands?model=${año}&brand=${marca}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const modelosData: string[] = await response.json()

      // Validate that we received an array
      if (!Array.isArray(modelosData)) {
        throw new Error("Formato de respuesta inválido")
      }

      setModelos(modelosData)
    } catch (error) {
      console.error("Error fetching modelos:", error)

      // For development/testing, provide mock data if API fails
      const mockModelos = ["CRV", "Civic", "Accord", "Pilot", "HR-V"]
      setModelos(mockModelos)
      setModeloError("Usando datos de prueba (API no disponible)")
    } finally {
      setIsLoadingModelos(false)
    }
  }

  const fetchDescripciones = async (año: string, marca: string, modelo: string) => {
    if (!/^\d{4}$/.test(año) || !marca || !modelo) {
      return
    }

    setIsLoadingDescripciones(true)
    setDescripcionError("")

    try {
      const username = "Proteg@apitherocketcode.com"
      const password = "11ulaIWhR874O564"
      const credentials = btoa(`${username}:${password}`)

      const response = await fetch(
        `https://api.catalogos.therocketcode.com/api/v1/catalogs/qualitas/description?model=${año}&brand=${marca}&subBrand=${modelo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const descripcionesData: string[] = await response.json()

      // Validate that we received an array
      if (!Array.isArray(descripcionesData)) {
        throw new Error("Formato de respuesta inválido")
      }

      setDescripciones(descripcionesData)
    } catch (error) {
      console.error("Error fetching descripciones:", error)

      // For development/testing, provide mock data if API fails
      const mockDescripciones = ["Elegance 2WD", "Sport 4WD", "Base", "LX 4P V6 3.5L AUT., 05 OCUP."]
      setDescripciones(mockDescripciones)
      setDescripcionError("Usando datos de prueba (API no disponible)")
    } finally {
      setIsLoadingDescripciones(false)
    }
  }

  const isFormValid = () => {
    return (
      editableVehicleData.marca.trim() !== "" &&
      editableVehicleData.año.trim() !== "" &&
      editableVehicleData.modelo.trim() !== "" &&
      editableVehicleData.descripcion.trim() !== "" &&
      editableUserData.genero.trim() !== "" &&
      editableUserData.fechaNacimiento.trim() !== "" &&
      editableUserData.codigoPostal.trim() !== "" &&
      editableUserData.codigoPostal.length === 5 &&
      /^\d{5}$/.test(editableUserData.codigoPostal)
    )
  }

  // Utilidad para obtener el precio más bajo y la aseguradora para cada plan
  function getLowestPriceAndInsurer(plan: "amplia" | "limitada" | "rc") {
    let minPrice = Number.POSITIVE_INFINITY
    let minInsurer: any = null // Forzamos el tipo any para evitar el error de never
    insurers.forEach((insurer) => {
      if (insurer.isError || insurer.isLoading) return
      const priceStr = insurer.prices?.[plan]
      if (!priceStr || priceStr === "-") return
      const price = Number.parseFloat(priceStr.replace(/[$,]/g, ""))
      if (price < minPrice) {
        minPrice = price
        minInsurer = insurer
      }
    })
    if (minInsurer && minPrice !== Number.POSITIVE_INFINITY) {
      return {
        price: `$${minPrice.toLocaleString("es-MX")}`,
        insurer: minInsurer.name,
        logo: minInsurer.logo,
      }
    }
    return null
  }

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
                    {/* Campo Año */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-año" className="text-sm font-medium text-gray-700">
                        Año <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-año"
                        value={editableVehicleData.año}
                        onChange={(e) => {
                          const value = e.target.value
                          // Solo permitir números y máximo 4 dígitos
                          if (/^\d{0,4}$/.test(value)) {
                            setEditableVehicleData({ ...editableVehicleData, año: value })

                            // Clear dependent fields if año is empty
                            if (!value) {
                              setEditableVehicleData((prev) => ({
                                ...prev,
                                año: value,
                                marca: "",
                                modelo: "",
                                descripcion: "",
                              }))
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value && /^\d{4}$/.test(value)) {
                            // Fetch brands when year is entered
                            fetchMarcas(value)
                          }
                        }}
                        className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                        maxLength={4}
                        required
                      />
                    </div>

                    {/* Campo Marca */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-marca" className="text-sm font-medium text-gray-700">
                        Marca <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={editableVehicleData.marca}
                        onValueChange={(value) => {
                          setEditableVehicleData({
                            ...editableVehicleData,
                            marca: value,
                            modelo: "", // Clear modelo when marca changes
                            descripcion: "", // Clear descripcion when marca changes
                          })

                          // Fetch modelos when marca changes
                          if (value && editableVehicleData.año) {
                            fetchModelos(editableVehicleData.año, value)
                          }
                        }}
                        disabled={!editableVehicleData.año || isLoadingMarcas}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                          <SelectValue
                            placeholder={
                              isLoadingMarcas
                                ? "Cargando marcas..."
                                : !editableVehicleData.año
                                  ? "Primero ingresa un año válido"
                                  : "Selecciona una marca"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map((marca, index) => (
                            <SelectItem key={index} value={marca}>
                              {marca}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {marcaError && <p className="text-xs text-red-500">{marcaError}</p>}
                    </div>

                    {/* Campo Modelo */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-modelo" className="text-sm font-medium text-gray-700">
                        Modelo <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={editableVehicleData.modelo}
                        onValueChange={(value) => {
                          setEditableVehicleData({
                            ...editableVehicleData,
                            modelo: value,
                            descripcion: "", // Clear descripcion when modelo changes
                          })

                          // Fetch descripciones when modelo changes
                          if (value && editableVehicleData.año && editableVehicleData.marca) {
                            fetchDescripciones(editableVehicleData.año, editableVehicleData.marca, value)
                          }
                        }}
                        disabled={!editableVehicleData.marca || isLoadingModelos}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                          <SelectValue
                            placeholder={
                              isLoadingModelos
                                ? "Cargando modelos..."
                                : !editableVehicleData.marca
                                  ? "Primero selecciona una marca"
                                  : "Selecciona un modelo"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {modelos.map((modelo, index) => (
                            <SelectItem key={index} value={modelo}>
                              {modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {modeloError && <p className="text-xs text-red-500">{modeloError}</p>}
                    </div>

                    {/* Campo Descripción */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-descripcion" className="text-sm font-medium text-gray-700">
                        Descripción <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={editableVehicleData.descripcion}
                        onValueChange={(value) =>
                          setEditableVehicleData({ ...editableVehicleData, descripcion: value })
                        }
                        disabled={!editableVehicleData.modelo || isLoadingDescripciones}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                          <SelectValue
                            placeholder={
                              isLoadingDescripciones
                                ? "Cargando descripciones..."
                                : !editableVehicleData.modelo
                                  ? "Primero selecciona un modelo"
                                  : "Selecciona una descripción"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {descripciones.map((descripcion, index) => (
                            <SelectItem key={index} value={descripcion}>
                              {descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {descripcionError && <p className="text-xs text-red-500">{descripcionError}</p>}
                    </div>
                  </div>
                </div>

                {/* User Data */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Datos del usuario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        !editableUserData.codigoPostal
                      ) {
                        alert("Por favor, completa todos los campos obligatorios.")
                        return
                      }

                      if (editableUserData.codigoPostal.length !== 5) {
                        alert("El código postal debe tener exactamente 5 dígitos.")
                        return
                      }

                      setIsEditMode(false)
                    }}
                    className="bg-[#8BC34A] hover:bg-[#7CB342] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!isFormValid()}
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
                    {editableVehicleData.marca || "Honda"} - {editableVehicleData.año || "2017"} -{" "}
                    {editableVehicleData.modelo || "CRV"} - {editableVehicleData.descripcion || "Elegance 2WD"}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    {editableUserData.genero || "Femenino"} - {editableUserData.fechaNacimiento || "2001-02-01"} -{" "}
                    {editableUserData.codigoPostal || "07310"}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-4">
          <div className="lg:col-span-1">
            <Select defaultValue="anual">
              <SelectTrigger className="w-full border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">Plan anual</SelectItem>
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
              <div className="text-xl font-bold mt-1">
                {(() => {
                  const lowest = getLowestPriceAndInsurer("amplia")
                  return lowest ? lowest.price : "-"
                })()}
              </div>
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
              <div className="text-xl font-bold mt-1">
                {(() => {
                  const lowest = getLowestPriceAndInsurer("limitada")
                  return lowest ? lowest.price : "-"
                })()}
              </div>
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
              <div className="text-xl font-bold mt-1">
                {(() => {
                  const lowest = getLowestPriceAndInsurer("rc")
                  return lowest ? lowest.price : "-"
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Comparison Table (Visual Cards Grid) */}
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
          {getSortedInsurers().map((insurer) => {
            const showError = insurer.isError;
            return (
              <div key={insurer.id}>
                <Card className={`border ${insurer.isHighlighted ? "border-[#8BC34A] bg-[#F8FFF8]" : "border-gray-200"} ${insurer.isError ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <div className="h-10 w-20 relative">
                          <Image
                            src={insurer.logo || "/placeholder.svg"}
                            alt={`Logo de ${insurer.name}`}
                            fill
                            style={{ objectFit: "contain", objectPosition: "left" }}
                          />
                        </div>
                      </div>
                      {showError ? (
                        <div className="col-span-3 text-center">
                          <span className="text-red-600 font-semibold text-xs">Datos no disponibles para esta aseguradora</span>
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-lg text-[#8BC34A] text-center">
                            {insurer.isLoading ? (
                              <Skeleton className="mx-auto h-6 w-20 rounded bg-gray-200" />
                            ) : (
                              insurer.prices?.[selectedPlan] ?? "-"
                            )}
                          </div>
                          <div className="text-gray-600 text-center">
                            {insurer.isLoading ? (
                              <Skeleton className="mx-auto h-5 w-16 rounded bg-gray-200" />
                            ) : (
                              insurer.deductible ?? "-"
                            )}
                          </div>
                          <div className="text-gray-600 text-center">
                            {insurer.isLoading ? (
                              <Skeleton className="mx-auto h-5 w-16 rounded bg-gray-200" />
                            ) : (
                              insurer.medicalExpenses ?? "-"
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#8BC34A] border-[#8BC34A] flex items-center gap-1"
                          onClick={() => toggleExpanded(insurer.id)}
                          disabled={insurer.isError || insurer.isLoading}
                        >
                          Coberturas
                          {expandedInsurer === insurer.id ? (
                            <ChevronUp className="w-4 h-4 ml-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-1" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded Coverage Details */}
                {expandedInsurer === insurer.id && !insurer.isError && !insurer.isLoading && renderCoverageDetails(insurer.coveragesRaw?.[selectedPlan])}
              </div>
            );
          })}
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
