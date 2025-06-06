"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car } from "lucide-react"
import Image from "next/image"

export default function CotizadorPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [vehicleData, setVehicleData] = useState({
    marca: "",
    año: "",
    modelo: "",
    descripcion: "",
  })

  const [userData, setUserData] = useState({
    codigoPostal: "11520",
    fechaNacimiento: "1985-06-15",
    genero: "Hombre",
  })

  const [selectedInsurers, setSelectedInsurers] = useState<string[]>(["HDI", "Mapfre", "GNP", "Chubb", "AXA"])
  const [cpError, setCpError] = useState("")

  const [marcas, setMarcas] = useState<string[]>([])
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(false)
  const [marcaError, setMarcaError] = useState("")

  const [modelos, setModelos] = useState<string[]>([])
  const [isLoadingModelos, setIsLoadingModelos] = useState(false)
  const [modeloError, setModeloError] = useState("")

  const [descripciones, setDescripciones] = useState<string[]>([])
  const [isLoadingDescripciones, setIsLoadingDescripciones] = useState(false)
  const [descripcionError, setDescripcionError] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render anything on the server
  if (!isMounted) {
    return null
  }

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

  const availableInsurers = [
    { id: "HDI", name: "HDI", logo: "/images/hdi-logo.png" },
    { id: "Mapfre", name: "Mapfre", logo: "/images/mapfre-logo.png" },
    { id: "GNP", name: "GNP", logo: "/images/gnp-logo.png" },
    { id: "Chubb", name: "Chubb", logo: "/images/chubb-logo.png" },
    { id: "AXA", name: "AXA", logo: "/images/axa-logo.png" },
  ]

  const handleInsurerToggle = (insurerId: string) => {
    setSelectedInsurers((prev) => {
      if (prev.includes(insurerId)) {
        // No permitir deseleccionar si es la única seleccionada
        if (prev.length === 1) return prev
        return prev.filter((id) => id !== insurerId)
      } else {
        return [...prev, insurerId]
      }
    })
  }

  const handleNext = () => {
    if (currentStep === 1) {
      const vehicleString = `${vehicleData.marca} - ${vehicleData.año} - ${vehicleData.modelo} - ${vehicleData.descripcion}`
      setSelectedVehicle(vehicleString)
      setCurrentStep(2)
    }
  }

  const validateCodigoPostal = (value: string) => {
    // Solo permitir números
    if (!/^\d*$/.test(value)) {
      setCpError("El código postal solo debe contener números")
      return false
    }

    if (value.length > 0 && value.length !== 5) {
      setCpError("El código postal debe tener 5 dígitos")
      return false
    }

    setCpError("")
    return true
  }

  const handleCodigoPostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setUserData({ ...userData, codigoPostal: value })
      validateCodigoPostal(value)
    }
  }

  const handleCotizar = async () => {
    if (
      !userData.codigoPostal ||
      !userData.fechaNacimiento ||
      !userData.genero ||
      selectedInsurers.length === 0 ||
      !!cpError
    ) {
      return
    }

    // Mostrar pantalla de procesamiento
    setIsProcessing(true)

    // Simular tiempo de procesamiento (scraping)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Navegar a resultados
    router.push("/resultados")
  }

  const calcularEdad = (fechaNacimiento: string): number | null => {
    if (!fechaNacimiento) {
      return null
    }

    try {
      const birthDate = new Date(fechaNacimiento)

      // Validar que sea una fecha válida
      if (isNaN(birthDate.getTime()) || birthDate > new Date() || birthDate.getFullYear() < 1900) {
        return null
      }

      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      return age
    } catch {
      return null
    }
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

      // Clear dependent fields when new marcas are loaded
      setVehicleData((prev) => ({
        ...prev,
        marca: "",
        modelo: "",
        descripcion: "",
      }))
    } catch (error) {
      console.error("Error fetching marcas:", error)

      // For development/testing, provide mock data if API fails
      const mockMarcas = ["Honda", "Toyota", "Nissan", "Volkswagen", "Chevrolet", "Ford"]
      setMarcas(mockMarcas)
      setMarcaError("Usando datos de prueba (API no disponible)")

      // Clear dependent fields
      setVehicleData((prev) => ({
        ...prev,
        marca: "",
        modelo: "",
        descripcion: "",
      }))
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
      const password = "11ulaIWhR874O564" // Use the same password as fetchMarcas
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

      // Clear dependent fields when new models are loaded
      setVehicleData((prev) => ({
        ...prev,
        modelo: "",
        descripcion: "",
      }))
    } catch (error) {
      console.error("Error fetching modelos:", error)

      // For development/testing, provide mock data if API fails
      const mockModelos = ["CRV", "Civic", "Accord", "Pilot", "HR-V"]
      setModelos(mockModelos)
      setModeloError("Usando datos de prueba (API no disponible)")

      // Clear dependent fields
      setVehicleData((prev) => ({
        ...prev,
        modelo: "",
        descripcion: "",
      }))
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

      // Clear description field when new descriptions are loaded
      setVehicleData((prev) => ({
        ...prev,
        descripcion: "",
      }))
    } catch (error) {
      console.error("Error fetching descripciones:", error)

      // For development/testing, provide mock data if API fails
      const mockDescripciones = ["Elegance 2WD", "Sport 4WD", "Base", "LX 4P V6 3.5L AUT., 05 OCUP."]
      setDescripciones(mockDescripciones)
      setDescripcionError("Usando datos de prueba (API no disponible)")

      // Clear description field
      setVehicleData((prev) => ({
        ...prev,
        descripcion: "",
      }))
    } finally {
      setIsLoadingDescripciones(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
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

        <div className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Completa los datos del automóvil.</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo Año */}
              <div className="space-y-2">
                <Label htmlFor="año" className="text-sm font-medium text-gray-700">
                  Año
                </Label>
                <Input
                  id="año"
                  placeholder="YYYY"
                  value={vehicleData.año}
                  onChange={(e) => {
                    const value = e.target.value
                    // Solo permitir números y máximo 4 dígitos
                    if (/^\d{0,4}$/.test(value)) {
                      setVehicleData({ ...vehicleData, año: value })

                      // Clear dependent fields and marcas if año is empty
                      if (!value) {
                        setMarcas([])
                        setVehicleData((prev) => ({
                          ...prev,
                          año: value,
                          marca: "",
                          modelo: "",
                          descripcion: "",
                        }))
                        setMarcaError("")
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    if (value && /^\d{4}$/.test(value)) {
                      fetchMarcas(value)
                    }
                  }}
                  maxLength={4}
                  className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                />
              </div>

              {/* Campo Marca */}
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-sm font-medium text-gray-700">
                  Marca
                </Label>
                <Select
                  value={vehicleData.marca}
                  onValueChange={(value) => {
                    setVehicleData({
                      ...vehicleData,
                      marca: value,
                      modelo: "", // Clear modelo when marca changes
                      descripcion: "", // Clear descripcion when marca changes
                    })

                    // Fetch modelos when marca changes
                    if (value && vehicleData.año) {
                      fetchModelos(vehicleData.año, value)
                    } else {
                      setModelos([])
                    }
                  }}
                  disabled={marcas.length === 0 || isLoadingMarcas}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                    <SelectValue
                      placeholder={
                        isLoadingMarcas
                          ? "Cargando marcas..."
                          : marcas.length === 0
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
                <Label htmlFor="modelo" className="text-sm font-medium text-gray-700">
                  Modelo
                </Label>
                <Select
                  value={vehicleData.modelo}
                  onValueChange={(value) => {
                    setVehicleData({
                      ...vehicleData,
                      modelo: value,
                      descripcion: "", // Clear descripcion when modelo changes
                    })

                    // Fetch descripciones when modelo changes
                    if (value && vehicleData.año && vehicleData.marca) {
                      fetchDescripciones(vehicleData.año, vehicleData.marca, value)
                    } else {
                      setDescripciones([])
                    }
                  }}
                  disabled={!vehicleData.marca || isLoadingModelos || modelos.length === 0}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                    <SelectValue
                      placeholder={
                        isLoadingModelos
                          ? "Cargando modelos..."
                          : !vehicleData.marca
                            ? "Primero selecciona una marca"
                            : modelos.length === 0
                              ? "No hay modelos disponibles"
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
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                  Descripción
                </Label>
                <Select
                  value={vehicleData.descripcion}
                  onValueChange={(value) => setVehicleData({ ...vehicleData, descripcion: value })}
                  disabled={!vehicleData.modelo || isLoadingDescripciones || descripciones.length === 0}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                    <SelectValue
                      placeholder={
                        isLoadingDescripciones
                          ? "Cargando descripciones..."
                          : !vehicleData.modelo
                            ? "Primero selecciona un modelo"
                            : descripciones.length === 0
                              ? "No hay descripciones disponibles"
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

            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8"
                disabled={!vehicleData.marca || !vehicleData.año || !vehicleData.modelo || !vehicleData.descripcion}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
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

        <div className="mt-6">
          {/* Selected Vehicle Display */}
          <Card className="bg-[#F5F5F5] mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{selectedVehicle}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#8BC34A] border-[#8BC34A] hover:bg-[#8BC34A] hover:text-white"
                  onClick={() => setCurrentStep(1)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Completa los datos demográficos.</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigoPostal" className="text-sm font-medium text-gray-700">
                  Código postal
                </Label>
                <Input
                  id="codigoPostal"
                  placeholder="Ingresa tu código postal"
                  value={userData.codigoPostal}
                  onChange={handleCodigoPostalChange}
                  maxLength={5}
                  className={`border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A] ${
                    cpError ? "border-red-500" : ""
                  }`}
                />
                {cpError && <p className="text-xs text-red-500">{cpError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento" className="text-sm font-medium text-gray-700">
                  Fecha de nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={userData.fechaNacimiento}
                  onChange={(e) => setUserData({ ...userData, fechaNacimiento: e.target.value })}
                  className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]"
                  max={new Date().toISOString().split("T")[0]}
                />
                {userData.fechaNacimiento && calcularEdad(userData.fechaNacimiento) !== null && (
                  <p className="text-xs text-gray-500">Edad: {calcularEdad(userData.fechaNacimiento)} años</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero" className="text-sm font-medium text-gray-700">
                  Género
                </Label>
                <Select value={userData.genero} onValueChange={(value) => setUserData({ ...userData, genero: value })}>
                  <SelectTrigger className="border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hombre">Hombre</SelectItem>
                    <SelectItem value="Mujer">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Selecciona las aseguradoras a consultar</Label>
              <p className="text-xs text-gray-500 mb-3">Debes seleccionar al menos una aseguradora</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableInsurers.map((insurer) => (
                  <div
                    key={insurer.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedInsurers.includes(insurer.id)
                        ? "border-[#8BC34A] bg-[#F8FFF8]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleInsurerToggle(insurer.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-16 relative">
                        <Image
                          src={insurer.logo || "/placeholder.svg"}
                          alt={`Logo de ${insurer.name}`}
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedInsurers.includes(insurer.id)}
                          onChange={() => handleInsurerToggle(insurer.id)}
                          className="w-4 h-4 text-[#8BC34A] border-gray-300 rounded focus:ring-[#8BC34A]"
                        />
                        <span className="text-sm font-medium text-gray-900">{insurer.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedInsurers.length} aseguradora{selectedInsurers.length !== 1 ? "s" : ""} seleccionada
                {selectedInsurers.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCotizar}
                className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8"
                disabled={
                  !userData.codigoPostal ||
                  !userData.fechaNacimiento ||
                  !userData.genero ||
                  selectedInsurers.length === 0 ||
                  !!cpError
                }
              >
                Cotizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Pantalla de procesamiento
  if (isProcessing) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8BC34A] mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Procesando su solicitud</h2>
          <p className="text-gray-600 text-center max-w-md">
            Estamos consultando las mejores opciones de seguros para ti. Este proceso puede tomar unos momentos...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizador manual</h1>
            <p className="text-gray-600 mt-1">Lorem ipsum dolor sit amet consectetur.</p>
          </div>
        </div>

        {/* Content */}
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </DashboardLayout>
  )
}
