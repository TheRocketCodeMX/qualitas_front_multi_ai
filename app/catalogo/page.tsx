"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Download, Upload, RefreshCw, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Solicitud {
  id: string
  fechaCarga: string
  numeroRegistros: number
  estatus: "En proceso" | "Completado"
}

export default function CatalogoPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [showSolicitudes, setShowSolicitudes] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validatedData, setValidatedData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const itemsPerPage = 5
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSolicitudes = solicitudes.slice(startIndex, endIndex)

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    if (showSolicitudes) {
      const interval = setInterval(() => {
        actualizarEstados()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [showSolicitudes])

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

  // Función para simular actualización de estados
  const actualizarEstados = () => {
    setSolicitudes((prev) =>
      prev.map((solicitud) => {
        if (solicitud.estatus === "En proceso") {
          // 40% de probabilidad de cambiar a "Completado"
          if (Math.random() < 0.4) {
            return { ...solicitud, estatus: "Completado" }
          }
        }
        return solicitud
      }),
    )
  }

  // Función para actualización manual
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simular delay
    actualizarEstados()
    setIsRefreshing(false)
    toast({
      title: "Actualizado",
      description: "El estado de las solicitudes se ha actualizado.",
      duration: 2000,
    })
  }

  // Calcular totales por estado
  const totales = {
    total: solicitudes.length,
    enProceso: solicitudes.filter((s) => s.estatus === "En proceso").length,
    completado: solicitudes.filter((s) => s.estatus === "Completado").length,
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  // Función para descargar el layout de Excel
  const handleDownloadLayout = () => {
    try {
      const columns = ["Número", "Año", "Marca", "Modelo", "Descripción", "CP", "Género", "Fecha nacimiento"]
      const exampleData = [
        "1",
        "2024",
        "ALFA ROMEO",
        "GIULIA",
        "ESTREMA 4P L4 2.0T AUT., 05 OCUP.",
        "55107",
        "MASCULINO",
        "25-04-1988",
      ]

      // Crear datos con encabezados y ejemplo
      const layoutData = [columns, exampleData]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(layoutData)

      // Ajustar ancho de columnas para mejor visualización
      const colWidths = [
        { wch: 10 }, // Número
        { wch: 8 }, // Año
        { wch: 15 }, // Marca
        { wch: 15 }, // Modelo
        { wch: 35 }, // Descripción
        { wch: 8 }, // CP
        { wch: 12 }, // Género
        { wch: 15 }, // Fecha nacimiento
      ]
      ws["!cols"] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Layout")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "layout_consulta_masiva.xlsx"
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Layout descargado",
        description: "El archivo layout_consulta_masiva.xlsx se ha descargado correctamente con ejemplo de llenado.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al descargar el layout:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar el layout. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Función para descargar los resultados procesados
  const handleDownloadResults = (solicitud: Solicitud) => {
    try {
      // Crear headers para el Excel con estructura detallada
      const headers = [
        "Número",
        "Marca",
        "Modelo",
        "Año",
        "Año nacimiento",
        "CP",
        "Género",
        // CHUBB
        "CHUBB - Amplia - Prima Anual",
        "CHUBB - Amplia - Deducible",
        "CHUBB - Amplia - Gastos Médicos",
        "CHUBB - Amplia - Coberturas",
        "CHUBB - Limitada - Prima Anual",
        "CHUBB - Limitada - Deducible",
        "CHUBB - Limitada - Gastos Médicos",
        "CHUBB - Limitada - Coberturas",
        "CHUBB - RC - Prima Anual",
        "CHUBB - RC - Deducible",
        "CHUBB - RC - Gastos Médicos",
        "CHUBB - RC - Coberturas",
        // MAPFRE
        "MAPFRE - Amplia - Prima Anual",
        "MAPFRE - Amplia - Deducible",
        "MAPFRE - Amplia - Gastos Médicos",
        "MAPFRE - Amplia - Coberturas",
        "MAPFRE - Limitada - Prima Anual",
        "MAPFRE - Limitada - Deducible",
        "MAPFRE - Limitada - Gastos Médicos",
        "MAPFRE - Limitada - Coberturas",
        "MAPFRE - RC - Prima Anual",
        "MAPFRE - RC - Deducible",
        "MAPFRE - RC - Gastos Médicos",
        "MAPFRE - RC - Coberturas",
        // GNP
        "GNP - Amplia - Prima Anual",
        "GNP - Amplia - Deducible",
        "GNP - Amplia - Gastos Médicos",
        "GNP - Amplia - Coberturas",
        "GNP - Limitada - Prima Anual",
        "GNP - Limitada - Deducible",
        "GNP - Limitada - Gastos Médicos",
        "GNP - Limitada - Coberturas",
        "GNP - RC - Prima Anual",
        "GNP - RC - Deducible",
        "GNP - RC - Gastos Médicos",
        "GNP - RC - Coberturas",
        // HDI
        "HDI - Amplia - Prima Anual",
        "HDI - Amplia - Deducible",
        "HDI - Amplia - Gastos Médicos",
        "HDI - Limitada - Prima Anual",
        "HDI - Limitada - Deducible",
        "HDI - Limitada - Gastos Médicos",
        "HDI - Limitada - Coberturas",
        "HDI - RC - Prima Anual",
        "HDI - RC - Deducible",
        "HDI - RC - Gastos Médicos",
        "HDI - RC - Coberturas",
        // AXA
        "AXA - Amplia - Prima Anual",
        "AXA - Amplia - Deducible",
        "AXA - Amplia - Gastos Médicos",
        "AXA - Amplia - Coberturas",
        "AXA - Limitada - Prima Anual",
        "AXA - Limitada - Deducible",
        "AXA - Limitada - Gastos Médicos",
        "AXA - Limitada - Coberturas",
        "AXA - RC - Prima Anual",
        "AXA - RC - Deducible",
        "AXA - RC - Gastos Médicos",
        "AXA - RC - Coberturas",
      ]

      // Generar datos de ejemplo para los resultados procesados
      const resultData = [headers]

      const aseguradoras = ["CHUBB", "MAPFRE", "GNP", "HDI", "AXA"]
      const marcas = ["Honda", "Toyota", "Nissan", "Volkswagen", "Chevrolet"]
      const modelos = ["CRV", "Corolla", "Sentra", "Jetta", "Aveo"]
      const coberturas = ["Amplia", "Limitada", "RC"]

      for (let i = 1; i <= solicitud.numeroRegistros; i++) {
        const vehicleData = [
          i, // Número
          marcas[Math.floor(Math.random() * marcas.length)], // Marca
          modelos[Math.floor(Math.random() * modelos.length)], // Modelo
          2015 + Math.floor(Math.random() * 9), // Año 2015-2023
          1970 + Math.floor(Math.random() * 35), // Año nacimiento 1970-2004
          String(10000 + Math.floor(Math.random() * 90000)).substring(0, 5), // CP
          Math.random() > 0.5 ? "Masculino" : "Femenino", // Género
        ]

        // Generar datos para cada aseguradora y cobertura
        const insuranceData: any[] = []

        aseguradoras.forEach((aseguradora) => {
          coberturas.forEach((cobertura) => {
            let basePrice = 0
            let deducible = ""
            let gastosMedicos = ""
            let coberturaDesc = ""

            // Configurar precios base según cobertura
            switch (cobertura) {
              case "Amplia":
                basePrice = 8000 + Math.floor(Math.random() * 4000)
                deducible = "10% del valor comercial"
                gastosMedicos = `$${(150000 + Math.floor(Math.random() * 100000)).toLocaleString()}`
                coberturaDesc = "Robo total, Daños materiales, RC, Gastos médicos, Asistencia"
                break
              case "Limitada":
                basePrice = 4000 + Math.floor(Math.random() * 2000)
                deducible = "5% del valor comercial"
                gastosMedicos = `$${(50000 + Math.floor(Math.random() * 50000)).toLocaleString()}`
                coberturaDesc = "RC, Gastos médicos, Asistencia"
                break
              case "RC":
                basePrice = 2500 + Math.floor(Math.random() * 1500)
                deducible = "N/A"
                gastosMedicos = `$${(30000 + Math.floor(Math.random() * 20000)).toLocaleString()}`
                coberturaDesc = "Responsabilidad Civil únicamente"
                break
            }

            insuranceData.push(
              `$${basePrice.toLocaleString()}`, // Prima Anual
              deducible, // Deducible
              gastosMedicos, // Gastos Médicos
              coberturaDesc, // Coberturas
            )
          })
        })

        // Combinar datos del vehículo con datos de seguros
        const row = [...vehicleData, ...insuranceData]
        resultData.push(row)
      }

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(resultData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 8 }, // Número
        { wch: 12 }, // Marca
        { wch: 12 }, // Modelo
        { wch: 8 }, // Año
        { wch: 15 }, // Año nacimiento
        { wch: 8 }, // CP
        { wch: 12 }, // Género
        // Repetir para cada aseguradora y cobertura (60 columnas más)
        ...Array(60).fill({ wch: 18 }),
      ]
      ws["!cols"] = colWidths

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Resultados Detallados")

      // Generar archivo y descargar
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `resultados_detallados_${solicitud.id}.xlsx`
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Resultados descargados",
        description: `El archivo resultados_detallados_${solicitud.id}.xlsx se ha descargado correctamente.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al descargar los resultados:", error)
      toast({
        title: "Error",
        description: "No se pudieron descargar los resultados. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Función para validar el formato del layout
  const validateLayoutFormat = (data: any[]): { isValid: boolean; errors: string[]; validData: any[] } => {
    const errors: string[] = []
    const expectedColumns = ["Número", "Año", "Marca", "Modelo", "Descripción", "CP", "Género", "Fecha nacimiento"]

    if (data.length < 2) {
      errors.push("El archivo debe contener al menos una fila de encabezados y una fila de datos")
      return { isValid: false, errors, validData: [] }
    }

    const headers = data[0]

    // Validar que tenga exactamente las columnas esperadas
    if (headers.length !== expectedColumns.length) {
      errors.push(`El archivo debe tener exactamente ${expectedColumns.length} columnas`)
    }

    // Validar que las columnas coincidan exactamente
    expectedColumns.forEach((expectedCol, index) => {
      if (headers[index] !== expectedCol) {
        errors.push(
          `La columna ${index + 1} debe ser "${expectedCol}", pero se encontró "${headers[index] || "vacía"}"`,
        )
      }
    })

    if (errors.length > 0) {
      return { isValid: false, errors, validData: [] }
    }

    // Validar datos de cada fila
    const validData: any[] = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowErrors: string[] = []

      // Validar que la fila tenga el número correcto de columnas
      if (row.length !== expectedColumns.length) {
        errors.push(`La fila ${i + 1} debe tener ${expectedColumns.length} columnas`)
        continue
      }

      // Validar cada campo obligatorio
      expectedColumns.forEach((colName, colIndex) => {
        const cellValue = row[colIndex]

        if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") {
          rowErrors.push(`${colName} es obligatorio`)
        } else {
          // Validaciones específicas por tipo de campo
          switch (colName) {
            case "Número":
              if (isNaN(Number(cellValue)) || Number(cellValue) <= 0) {
                rowErrors.push("Número debe ser un valor numérico positivo")
              }
              break
            case "Año":
              const year = Number(cellValue)
              if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
                rowErrors.push(`Año debe estar entre 1990 y ${new Date().getFullYear() + 1}`)
              }
              break
            case "CP":
              const cp = String(cellValue).trim()
              if (!/^\d{5}$/.test(cp)) {
                rowErrors.push("CP debe ser un código postal de 5 dígitos")
              }
              break
            case "Género":
              const gender = String(cellValue).trim().toLowerCase()
              if (!["masculino", "femenino", "hombre", "mujer", "m", "f"].includes(gender)) {
                rowErrors.push("Género debe ser Masculino, Femenino, Hombre, Mujer, M o F")
              }
              break
            case "Fecha nacimiento":
              const dateStr = String(cellValue).trim()
              // Validar formato DD-MM-YYYY específicamente
              const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/
              const match = dateStr.match(dateRegex)

              if (!match) {
                rowErrors.push("Fecha nacimiento debe tener el formato DD-MM-YYYY (ejemplo: 25-04-1988)")
              } else {
                const [, day, month, year] = match
                const dayNum = Number.parseInt(day, 10)
                const monthNum = Number.parseInt(month, 10)
                const yearNum = Number.parseInt(year, 10)

                // Validar rangos válidos
                if (dayNum < 1 || dayNum > 31) {
                  rowErrors.push("Fecha nacimiento: el día debe estar entre 01 y 31")
                }
                if (monthNum < 1 || monthNum > 12) {
                  rowErrors.push("Fecha nacimiento: el mes debe estar entre 01 y 12")
                }
                if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
                  rowErrors.push(`Fecha nacimiento: el año debe estar entre 1900 y ${new Date().getFullYear()}`)
                }

                // Validar que la fecha sea válida (no como 31-02-2024)
                const testDate = new Date(yearNum, monthNum - 1, dayNum)
                if (
                  testDate.getDate() !== dayNum ||
                  testDate.getMonth() !== monthNum - 1 ||
                  testDate.getFullYear() !== yearNum
                ) {
                  rowErrors.push("Fecha nacimiento: la fecha no es válida (ejemplo: 31-02-2024 no existe)")
                }
              }
              break
          }
        }
      })

      if (rowErrors.length > 0) {
        errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`)
      } else {
        validData.push(row)
      }
    }

    return { isValid: errors.length === 0, errors, validData }
  }

  // Función para manejar la carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setUploadSuccess(null)
    setValidationErrors([])

    const file = event.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    if (fileExt !== "xls" && fileExt !== "xlsx") {
      setUploadError("Solo se permiten archivos Excel (.xls o .xlsx)")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const validMimeTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ]

    if (!validMimeTypes.includes(file.type)) {
      setUploadError("El archivo no es un documento Excel válido")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 1) {
          setUploadError("El archivo está vacío o no tiene el formato esperado")
          setIsUploading(false)
          return
        }

        // Validar formato y datos
        const validation = validateLayoutFormat(jsonData)

        if (!validation.isValid) {
          setValidationErrors(validation.errors)
          setUploadError("El archivo no cumple con el formato requerido. Revisa los errores detallados.")
          setIsUploading(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }

        // Si la validación es exitosa, mostrar modal de confirmación
        setValidatedData(validation.validData)
        setShowConfirmModal(true)
        setIsUploading(false)
      } catch (error) {
        console.error("Error al procesar el archivo:", error)
        setUploadError("Error al procesar el archivo. Verifica que sea un Excel válido.")
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }

    reader.onerror = () => {
      setUploadError("Error al leer el archivo")
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }

    reader.readAsArrayBuffer(file)
  }

  // Función para confirmar y procesar los datos validados
  const handleConfirmProcessing = () => {
    const recordCount = validatedData.length

    // Crear nuevas solicitudes basadas en los registros validados
    const nuevasSolicitudes: Solicitud[] = []
    const registrosPorSolicitud = 10 // Dividir en grupos de 10 registros

    for (let i = 0; i < recordCount; i += registrosPorSolicitud) {
      const registrosEnGrupo = Math.min(registrosPorSolicitud, recordCount - i)
      const nuevaSolicitud: Solicitud = {
        id: `SOL-${Date.now()}-${Math.floor(i / registrosPorSolicitud + 1)}`,
        fechaCarga: new Date().toLocaleString("es-ES"),
        numeroRegistros: registrosEnGrupo,
        estatus: "En proceso",
      }
      nuevasSolicitudes.push(nuevaSolicitud)
    }

    setSolicitudes((prev) => [...prev, ...nuevasSolicitudes])
    setShowSolicitudes(true)
    setCurrentPage(1)

    setUploadSuccess(
      `Archivo procesado correctamente. ${recordCount} registros válidos procesados en ${nuevasSolicitudes.length} solicitudes.`,
    )

    toast({
      title: "Archivo procesado",
      description: `Se han creado ${nuevasSolicitudes.length} solicitudes de procesamiento.`,
      duration: 3000,
    })

    // Limpiar estados
    setShowConfirmModal(false)
    setValidatedData([])
    setValidationErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getStatusBadge = (estatus: Solicitud["estatus"]) => {
    switch (estatus) {
      case "En proceso":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 En proceso</Badge>
      case "Completado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">🟢 Completado</Badge>
      default:
        return <Badge variant="secondary">{estatus}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de datos</h1>
          <p className="text-gray-600 mt-1">Casos de uso</p>
        </div>

        {/* Mensajes de error/éxito */}
        {uploadError && (
          <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <AlertDescription className="text-red-600 font-medium">{uploadError}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <Alert className="mb-4 border-[#8BC34A] bg-[#F8FFF8]">
            <CheckCircle className="h-5 w-5 text-[#8BC34A] mr-2" />
            <AlertDescription className="text-[#8BC34A] font-medium">{uploadSuccess}</AlertDescription>
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-red-600">Errores de validación encontrados:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-red-500">... y {validationErrors.length - 10} errores más</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white" onClick={handleDownloadLayout}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Layout
          </Button>

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button variant="outline" className="border-gray-300 text-gray-700" disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Cargando..." : "Cargar Base"}
            </Button>
          </div>
        </div>

        {/* Sección de Estado de solicitudes procesadas */}
        {showSolicitudes && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Estado de solicitudes procesadas</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[#8BC34A] border-[#8BC34A]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>

            {/* Resumen superior */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de solicitudes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{totales.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">En proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{totales.enProceso}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totales.completado}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de solicitudes */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium">ID de solicitud</TableHead>
                      <TableHead className="font-medium">Fecha y hora de carga</TableHead>
                      <TableHead className="font-medium">Número de registros</TableHead>
                      <TableHead className="font-medium">Estatus actual</TableHead>
                      <TableHead className="font-medium">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSolicitudes.map((solicitud) => (
                      <TableRow key={solicitud.id} className="border-t border-gray-200">
                        <TableCell className="font-mono text-sm">{solicitud.id}</TableCell>
                        <TableCell>{solicitud.fechaCarga}</TableCell>
                        <TableCell>{solicitud.numeroRegistros}</TableCell>
                        <TableCell>{getStatusBadge(solicitud.estatus)}</TableCell>
                        <TableCell>
                          {solicitud.estatus === "Completado" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-[#8BC34A]"
                              onClick={() => handleDownloadResults(solicitud)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400" disabled>
                              <Eye className="h-4 w-4 mr-1" />
                              Procesando...
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center py-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 px-2 text-[#8BC34A] border-[#8BC34A]"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageClick(page)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page
                              ? "bg-[#8BC34A] hover:bg-[#7CB342] text-white"
                              : "text-gray-600 border-gray-300"
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2 text-[#8BC34A] border-[#8BC34A]"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar procesamiento</DialogTitle>
              <DialogDescription>
                Se han validado {validatedData.length} registros correctamente. ¿Deseas proceder con el procesamiento de
                estos datos?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Registros válidos:</strong> {validatedData.length}
                </p>
                <p>
                  <strong>Solicitudes a procesar:</strong> {Math.ceil(validatedData.length / 10)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false)
                  setValidatedData([])
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmProcessing} className="bg-[#8BC34A] hover:bg-[#7CB342] text-white">
                Confirmar procesamiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
