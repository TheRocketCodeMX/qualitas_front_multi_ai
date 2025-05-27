"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Download, Upload, RefreshCw, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as XLSX from "xlsx"

interface Solicitud {
  id: string
  fechaCarga: string
  numeroRegistros: number
  estatus: "En proceso" | "Terminado" | "Completado"
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
          // 30% de probabilidad de cambiar a "Terminado"
          if (Math.random() < 0.3) {
            return { ...solicitud, estatus: "Terminado" }
          }
        } else if (solicitud.estatus === "Terminado") {
          // 50% de probabilidad de cambiar a "Completado"
          if (Math.random() < 0.5) {
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
    terminado: solicitudes.filter((s) => s.estatus === "Terminado").length,
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
      const columns = ["Categoría", "Tipo", "Año", "Modelo", "Uso", "Fecha de nacimiento", "Sexo", "Teléfono"]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([columns])

      XLSX.utils.book_append_sheet(wb, ws, "Layout")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "layout_cotizacion.xlsx"
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Layout descargado",
        description: "El archivo layout_cotizacion.xlsx se ha descargado correctamente.",
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

        const recordCount = jsonData.length - 1

        // Crear nuevas solicitudes basadas en los registros cargados
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
          `Archivo cargado correctamente. ${recordCount} registros procesados en ${nuevasSolicitudes.length} solicitudes.`,
        )

        toast({
          title: "Archivo cargado",
          description: `Se han creado ${nuevasSolicitudes.length} solicitudes de procesamiento.`,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error al procesar el archivo:", error)
        setUploadError("Error al procesar el archivo. Verifica que sea un Excel válido.")
      } finally {
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

  const getStatusBadge = (estatus: Solicitud["estatus"]) => {
    switch (estatus) {
      case "En proceso":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 En proceso</Badge>
      case "Terminado":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">🔵 Terminado</Badge>
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
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <Alert className="mb-4 border-[#8BC34A] bg-[#F8FFF8]">
            <AlertDescription className="text-[#8BC34A]">{uploadSuccess}</AlertDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <CardTitle className="text-sm font-medium text-gray-600">Terminadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{totales.terminado}</div>
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
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-[#8BC34A]">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>
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
      </div>
    </DashboardLayout>
  )
}
