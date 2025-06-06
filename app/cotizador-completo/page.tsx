"use client"

import { useState, useEffect } from "react"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Download, Plus } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// --- Tipos para aseguradoras y cotización ---
interface InsurerResult {
  id: string
  nombre: string
  logo: string
  isLoading: boolean
  isError: boolean
  prices?: Record<string, string>
  deductible?: string
  medicalExpenses?: string
  coveragesRaw?: Record<string, any>
  isHighlighted?: boolean
  errorMsg?: string
}

const INSURERS = [
  { id: "HDI", nombre: "HDI", logo: "/images/hdi-logo.png" },
  { id: "Mapfre", nombre: "Mapfre", logo: "/images/mapfre-logo.png" },
  { id: "GNP", nombre: "GNP", logo: "/images/gnp-logo.png" },
  { id: "Chubb", nombre: "Chubb", logo: "/images/chubb-logo.png" },
  { id: "AXA", nombre: "AXA", logo: "/images/axa-logo.png" },
]

const insurerEndpoints: Record<string, string> = {
  HDI: "http://localhost:8080/cotizacion-api/api/cotizacion/1",
  Mapfre: "http://localhost:8080/cotizacion-api/api/cotizacion/3",
  GNP: "http://localhost:8080/cotizacion-api/api/cotizacion/3",
  Chubb: "http://localhost:8080/cotizacion-api/api/cotizacion/4",
  AXA: "http://localhost:8080/cotizacion-api/api/cotizacion/5",
}

export default function CotizadorCompletoPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [isMounted, setIsMounted] = useState(false)
  const [vehicleData, setVehicleData] = useState({ marca: "", año: "", modelo: "", descripcion: "" })
  const [userData, setUserData] = useState({ genero: "Hombre", fechaNacimiento: "1985-06-15", codigoPostal: "11520" })
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>(INSURERS.map(i => i.id))
  const [cpError, setCpError] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [insurers, setInsurers] = useState<InsurerResult[]>([])
  const [selectedPlan, setSelectedPlan] = useState<"amplia" | "limitada" | "rc">("amplia")
  const [expandedInsurer, setExpandedInsurer] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  // Validación de código postal
  const validateCodigoPostal = (value: string) => {
    if (!/^[0-9]*$/.test(value)) {
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
    if (/^\d*$/.test(value)) {
      setUserData({ ...userData, codigoPostal: value })
      validateCodigoPostal(value)
    }
  }

  // Cotizar: fetch paralelo, carga progresiva real
  const handleCotizar = async () => {
    if (!userData.codigoPostal || !userData.fechaNacimiento || !userData.genero || selectedInsurers.length === 0 || !!cpError) return
    setIsProcessing(true)
    setShowResults(true)
    setInsurers(selectedInsurers.map(id => {
      const found = INSURERS.find(i => i.id === id)
      return { ...found!, isLoading: true, isError: false }
    }))
    const [yyyy, mm, dd] = userData.fechaNacimiento.split("-")
    const fechaNacimientoBackend = `${dd}-${mm}-${yyyy}`
    const requestBody = {
      vBrand: vehicleData.marca,
      vSubBrand: vehicleData.modelo,
      vModel: vehicleData.año,
      vDescription: vehicleData.descripcion,
      vSexoPersona: userData.genero === "Hombre" ? "MASCULINO" : "FEMENINO",
      vFechaNacimientoPersona: fechaNacimientoBackend,
      vCodigoPostalPersona: userData.codigoPostal,
    }
    selectedInsurers.forEach(async (insurerId) => {
      const endpoint = insurerEndpoints[insurerId]
      if (!endpoint) {
        setInsurers(prev => prev.map(i => i.id === insurerId ? { ...i, isLoading: false, isError: true, errorMsg: "No endpoint definido" } : i))
        return
      }
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
        if (!res.ok) throw new Error(`Error en ${insurerId}`)
        const data = await res.json()
        let resultado = data.resultado
        if (insurerId === "Mapfre" && data.success && Array.isArray(data.resultado)) {
          resultado = [{
            AMPLIA: data.resultado[0].Amplia,
            LIMITADA: data.resultado[0].Limitada,
            RC: data.resultado[0].RC,
          }]
        }
        let coveragesRaw = resultado && resultado[0] ? resultado[0] : {}
        setInsurers(prev => prev.map(i =>
          i.id === insurerId
            ? {
                ...i,
                isLoading: false,
                isError: false,
                prices: {
                  amplia: coveragesRaw.AMPLIA?.dPrecioTotal ? `$${coveragesRaw.AMPLIA.dPrecioTotal}` : "-",
                  limitada: coveragesRaw.LIMITADA?.dPrecioTotal ? `$${coveragesRaw.LIMITADA.dPrecioTotal}` : "-",
                  rc: coveragesRaw.RC?.dPrecioTotal ? `$${coveragesRaw.RC.dPrecioTotal}` : "-",
                },
                deductible: coveragesRaw[selectedPlan.toUpperCase()]?.deductible || "-",
                medicalExpenses: coveragesRaw[selectedPlan.toUpperCase()]?.dGastosMedicos || "-",
                coveragesRaw: {
                  amplia: coveragesRaw.AMPLIA,
                  limitada: coveragesRaw.LIMITADA,
                  rc: coveragesRaw.RC,
                },
              }
            : i
        ))
      } catch (err: any) {
        setInsurers(prev => prev.map(i => i.id === insurerId ? { ...i, isLoading: false, isError: true, errorMsg: err?.message || "Error desconocido" } : i))
      }
    })
    setIsProcessing(false)
  }

  // Utilidad para transformar claves a formato legible
  function humanizeKey(key: string) {
    return key
      .replace(/^([A-Z])/, (m) => m.toUpperCase())
      .replace(/^([DVBI])/, "")
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\b([a-z])/g, (m) => m.toUpperCase())
  }

  // Ordenamiento de resultados
  const sortedInsurers = (() => {
    if (sortOrder === "asc") {
      return [...insurers].sort((a, b) => {
        const pa = Number((a.prices?.[selectedPlan] || "-").replace(/[^\d.]/g, "")) || Infinity
        const pb = Number((b.prices?.[selectedPlan] || "-").replace(/[^\d.]/g, "")) || Infinity
        return pa - pb
      })
    }
    if (sortOrder === "desc") {
      return [...insurers].sort((a, b) => {
        const pa = Number((a.prices?.[selectedPlan] || "-").replace(/[^\d.]/g, "")) || -Infinity
        const pb = Number((b.prices?.[selectedPlan] || "-").replace(/[^\d.]/g, "")) || -Infinity
        return pb - pa
      })
    }
    return insurers
  })()

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8BC34A]"></div>
      </div>
    )
  }
  if (!isAuthenticated) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizador manual</h1>
            <p className="text-gray-600 mt-1">Cotiza y compara aseguradoras en tiempo real.</p>
          </div>
          {showResults && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A] hover:text-white px-6 py-2"
                onClick={() => window.location.reload()}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </Button>
              <Button
                className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-6 py-2 shadow-sm"
                onClick={() => {
                  setShowResults(false)
                  setInsurers([])
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva cotización
              </Button>
            </div>
          )}
        </div>
        {/* Formulario de cotización */}
        {!showResults && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del vehículo y usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input placeholder="Marca" value={vehicleData.marca} onChange={e => setVehicleData({ ...vehicleData, marca: e.target.value })} />
                  <Input placeholder="Año" value={vehicleData.año} onChange={e => setVehicleData({ ...vehicleData, año: e.target.value })} />
                  <Input placeholder="Modelo" value={vehicleData.modelo} onChange={e => setVehicleData({ ...vehicleData, modelo: e.target.value })} />
                  <Input placeholder="Descripción" value={vehicleData.descripcion} onChange={e => setVehicleData({ ...vehicleData, descripcion: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={userData.genero} onValueChange={v => setUserData({ ...userData, genero: v })}>
                    <SelectTrigger><SelectValue placeholder="Género" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hombre">Hombre</SelectItem>
                      <SelectItem value="Mujer">Mujer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={userData.fechaNacimiento} onChange={e => setUserData({ ...userData, fechaNacimiento: e.target.value })} />
                  <Input placeholder="Código postal" value={userData.codigoPostal} onChange={handleCodigoPostalChange} maxLength={5} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-gray-700">Selecciona las aseguradoras a consultar</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {INSURERS.map((insurer) => (
                      <Button
                        key={insurer.id}
                        variant={selectedInsurers.includes(insurer.id) ? "default" : "outline"}
                        className={`flex items-center gap-2 ${selectedInsurers.includes(insurer.id) ? "bg-[#8BC34A] text-white" : "border-[#8BC34A] text-[#8BC34A]"}`}
                        onClick={() => {
                          setSelectedInsurers((prev) => {
                            if (prev.includes(insurer.id)) {
                              if (prev.length === 1) return prev
                              return prev.filter((id) => id !== insurer.id)
                            } else {
                              return [...prev, insurer.id]
                            }
                          })
                        }}
                      >
                        <Image src={insurer.logo} alt={insurer.nombre} width={32} height={32} />
                        {insurer.nombre}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{selectedInsurers.length} aseguradora(s) seleccionada(s)</p>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-[#8BC34A] text-white px-8 py-2" onClick={handleCotizar} disabled={isProcessing || !vehicleData.marca || !vehicleData.año || !vehicleData.modelo || !vehicleData.descripcion || !userData.codigoPostal || !userData.fechaNacimiento || !userData.genero || selectedInsurers.length === 0 || !!cpError}>
                    Cotizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Resultados y comparación */}
        {showResults && (
          <>
            <div className="mb-4 flex items-center gap-6">
              <span className="inline-block bg-[#8BC34A] text-white px-4 py-2 rounded font-semibold">Plan anual</span>
              <div className="lg:col-span-3 flex w-full max-w-xl">
                {/* Tabs de cobertura */}
                <div className={`flex-1 text-center p-4 rounded-l-lg cursor-pointer transition-all ${selectedPlan === "amplia" ? "bg-[#8BC34A] text-white" : "bg-white border-t border-b border-l border-gray-200 text-gray-600 hover:bg-gray-50"}`} onClick={() => setSelectedPlan("amplia")}>Amplia</div>
                <div className={`flex-1 text-center p-4 cursor-pointer transition-all ${selectedPlan === "limitada" ? "bg-[#8BC34A] text-white" : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"}`} onClick={() => setSelectedPlan("limitada")}>Limitada</div>
                <div className={`flex-1 text-center p-4 rounded-r-lg cursor-pointer transition-all ${selectedPlan === "rc" ? "bg-[#8BC34A] text-white" : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"}`} onClick={() => setSelectedPlan("rc")}>Responsabilidad civil</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="hidden md:grid grid-cols-5 gap-4 text-sm font-medium text-gray-600 px-4 flex-1">
                  <div>Aseguradora</div>
                  <div>Prima anual</div>
                  <div>Deducible robo total</div>
                  <div>Gastos médicos</div>
                  <div>Coberturas</div>
                </div>
                <div className="ml-4">
                  <Select value={sortOrder} onValueChange={v => setSortOrder(v as any)}>
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
              <div className="flex flex-col gap-0">
                {sortedInsurers.length === 0 ? (
                  <div className="text-center text-gray-500">No hay resultados para mostrar.</div>
                ) : (
                  sortedInsurers.map((insurer) => {
                    if (insurer.isLoading) {
                      return (
                        <div key={insurer.id} className="border-b border-gray-200 last:border-b-0 animate-pulse">
                          <div className="flex flex-row items-center w-full px-4 py-4 bg-gray-50">
                            <div className="flex items-center min-w-[120px] w-1/5">
                              <div className="h-10 w-20 bg-gray-200 rounded mr-3" />
                              <span className="font-bold text-base text-gray-400 text-left">Cargando...</span>
                            </div>
                            <div className="flex-1 text-center">
                              <span className="inline-block h-6 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="flex-1 text-center">
                              <span className="inline-block h-6 w-16 bg-gray-200 rounded" />
                            </div>
                            <div className="flex-1 text-center">
                              <span className="inline-block h-6 w-16 bg-gray-200 rounded" />
                            </div>
                            <div className="flex-1 flex justify-center">
                              <span className="inline-block h-8 w-24 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      )
                    }
                    if (insurer.isError) {
                      return (
                        <div key={insurer.id} className="border-b border-gray-200 last:border-b-0 opacity-60 relative">
                          <div className="flex flex-row items-center w-full px-4 py-4 bg-white">
                            <div className="flex items-center min-w-[120px] w-1/5">
                              <Image src={insurer.logo || "/placeholder.svg"} alt={insurer.nombre || insurer.id} width={80} height={40} className="mr-3" />
                              <span className="font-bold text-base text-gray-900 text-left">{insurer.nombre || insurer.id}</span>
                            </div>
                            <div className="flex-1 text-center text-red-600 font-semibold">{insurer.errorMsg || "Datos no disponibles para esta aseguradora"}</div>
                          </div>
                        </div>
                      )
                    }
                    // Normalización de datos por aseguradora
                    const cobertura = insurer.coveragesRaw?.[selectedPlan] || {}
                    let dynamicPrice = cobertura?.dPrecioTotal ? `$${cobertura.dPrecioTotal}` : (insurer.prices?.[selectedPlan] ?? "-")
                    let dynamicDeductible = cobertura?.deductible ? `${cobertura.deductible}%` : (insurer.deductible ?? "-")
                    let dynamicMedicalExpenses = cobertura?.dGastosMedicos ? `$${cobertura.dGastosMedicos}` : (insurer.medicalExpenses ?? "-")
                    return (
                      <div key={insurer.id} className="border-b border-gray-200 last:border-b-0">
                        <div className={`flex flex-row items-center w-full px-4 py-4 transition-all duration-200 relative bg-white`}>
                          <div className="flex items-center min-w-[120px] w-1/5">
                            <Image src={insurer.logo || "/placeholder.svg"} alt={insurer.nombre || insurer.id} width={80} height={40} className="mr-3" />
                            <span className="font-bold text-base text-gray-900 text-left">{insurer.nombre || insurer.id}</span>
                          </div>
                          <div className="flex-1 text-center">
                            <span className="font-bold text-lg text-[#8BC34A]">{dynamicPrice}</span>
                          </div>
                          <div className="flex-1 text-center">
                            <span className="font-semibold">{dynamicDeductible}</span>
                          </div>
                          <div className="flex-1 text-center">
                            <span className="font-semibold">{dynamicMedicalExpenses}</span>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#8BC34A] border-[#8BC34A] flex items-center gap-1"
                              onClick={() => setExpandedInsurer(expandedInsurer === insurer.id ? null : insurer.id)}
                              disabled={insurer.isError}
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
                        {/* Expanded Coverage Details */}
                        {!insurer.isError && expandedInsurer === insurer.id && cobertura && (
                          <div className="w-full bg-gray-50 px-8 py-6 animate-fade-in border-t border-b border-[#8BC34A]">
                            <h4 className="font-semibold text-gray-900 mb-4">Coberturas incluidas</h4>
                            {cobertura && Object.keys(cobertura).length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(cobertura).map(([key, value]) => (
                                  value !== null && value !== undefined && value !== "" && (
                                    <div key={key} className="flex flex-col bg-white rounded-lg shadow-sm p-4 border border-gray-200 min-h-[80px]">
                                      <span className="text-xs text-gray-500 mb-1 font-medium">{humanizeKey(key)}</span>
                                      {typeof value === "boolean" ? (
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                          {value ? "Sí" : "No"}
                                        </span>
                                      ) : typeof value === "number" ? (
                                        <span className="font-bold text-lg text-blue-700 mt-1">{value.toLocaleString("es-MX")}</span>
                                      ) : (
                                        <span className="font-semibold text-gray-900 mt-1 break-words">{String(value)}</span>
                                      )}
                                    </div>
                                  )
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500">No hay datos disponibles para esta cobertura.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
