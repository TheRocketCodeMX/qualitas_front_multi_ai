"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
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
import { cotizacionMasivaService, EstadoLoteResponse } from "@/services/cotizacionMasivaService"

// Componentes modulares
import CatalogoHeader from "./components/CatalogoHeader"
import CatalogoActions from "./components/CatalogoActions"
import CatalogoMessages from "./components/CatalogoMessages"
import CatalogoSummary from "./components/CatalogoSummary"
import CatalogoTable from "./components/CatalogoTable"
import CatalogoPagination from "./components/CatalogoPagination"
import CatalogoUploadModal from "./components/CatalogoUploadModal"

export default function CatalogoPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [solicitudes, setSolicitudes] = useState<EstadoLoteResponse[]>([])
  const [showSolicitudes, setShowSolicitudes] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loteEnProceso, setLoteEnProceso] = useState<EstadoLoteResponse | null>(null)

  const itemsPerPage = 5
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSolicitudes = solicitudes.slice(startIndex, endIndex)

  const fetchSolicitudes = useCallback(async () => {
    try {
      const response = await cotizacionMasivaService.consultarEstado()
      setSolicitudes(response.lotes)
      console.log("Solicitudes cargadas:", response.lotes)
    } catch (error) {
      console.error("Error al obtener solicitudes:", error)
    }
  }, [])

  const refreshLoteEnProceso = useCallback(async (idLote: number | undefined | null) => {
    if (typeof idLote !== 'number' || isNaN(idLote)) return;
    try {
      setIsRefreshing(true);
      const response = await cotizacionMasivaService.consultarEstadoLote(idLote);
      const lote = response.lote;
      setSolicitudes(prev => prev.map(s => s.idLote === idLote ? { ...s, ...lote } : s));
      if (lote.estadoLote === "COMPLETADO") {
        setLoteEnProceso(null);
        await fetchSolicitudes(); // Forzar actualización global
      } else {
        setLoteEnProceso(lote);
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSolicitudes]);

  // Efecto para identificar el lote en proceso al cargar o cuando cambian las solicitudes
  useEffect(() => {
    const lote = solicitudes.find(s => s.estadoLote === "EN_PROCESO");
    setLoteEnProceso(lote || null); // Si no hay, explícitamente null
  }, [solicitudes]);

  // Efecto para actualización automática del lote en proceso
  useEffect(() => {
    if (!loteEnProceso || typeof loteEnProceso.idLote !== 'number' || isNaN(loteEnProceso.idLote)) return;
    const interval = setInterval(() => {
      refreshLoteEnProceso(loteEnProceso.idLote);
    }, 10000);
    return () => clearInterval(interval);
  }, [loteEnProceso?.idLote, refreshLoteEnProceso]);

  useEffect(() => {
    fetchSolicitudes()
  }, [fetchSolicitudes])

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

  // Función para descargar el layout de Excel
  const handleDownloadLayout = () => {
    try {
      // Crear un enlace para descargar el archivo estático
      const link = document.createElement("a")
      link.href = "/LayoutCotizacionMasiva.xlsx"
      link.download = "LayoutCotizacionMasiva.xlsx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Layout descargado",
        description: "El archivo LayoutCotizacionMasiva.xlsx se ha descargado correctamente.",
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
  const handleDownloadResults = (nombreLote: string) => {
    // Implementar descarga de resultados
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
          setUploadError("El archivo no cumple con el formato requerido. Revisa los errores detallados.")
          setIsUploading(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }

        // Si la validación es exitosa, mostrar modal de confirmación
        setIsModalOpen(true)
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

  const handleUpload = () => {
    setIsModalOpen(true)
  }

  const handleValidationComplete = async (result: any) => {
    fetchSolicitudes();
  }

  const handleRefreshStatus = (nombreLote: string) => {
    const lote = solicitudes.find(s => s.nombreLote === nombreLote)
    if (lote) {
      refreshLoteEnProceso(lote.idLote)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <CatalogoHeader />

        {/* Mensajes de error/éxito */}
        <CatalogoMessages
          uploadError={uploadError}
          uploadSuccess={uploadSuccess}
        />

        {/* Action Buttons */}
        <CatalogoActions
          onDownloadLayout={handleDownloadLayout}
          onOpenUploadModal={() => setIsModalOpen(true)}
          isUploading={isUploading}
        />

        {/* Sección de Estado de solicitudes procesadas */}
        {showSolicitudes && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Estado de solicitudes procesadas</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchSolicitudes();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className="text-[#8BC34A] border-[#8BC34A]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>

            {/* Resumen superior */}
            <CatalogoSummary
              total={solicitudes.length}
              enProceso={solicitudes.filter(s => s.estadoLote === "EN_PROCESO").length}
              completado={solicitudes.filter(s => s.estadoLote === "COMPLETADO").length}
            />

            {/* Tabla de solicitudes */}
            <CatalogoTable
              solicitudes={solicitudes}
              onDownloadResults={handleDownloadResults}
              onRefreshStatus={handleRefreshStatus}
              isRefreshing={isRefreshing}
            />

            {/* Pagination */}
            {/*<CatalogoPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />*/}
          </div>
        )}

        <CatalogoUploadModal
          isOpen={isModalOpen}
          onClose={async () => {
            console.log("onClose del padre ejecutado");
            setIsModalOpen(false);
            await fetchSolicitudes();
          }}
          onValidationComplete={handleValidationComplete}
        />
      </div>
    </DashboardLayout>
  )
}
