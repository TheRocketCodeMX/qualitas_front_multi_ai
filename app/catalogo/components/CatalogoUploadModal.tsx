import React, { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { ValidacionResponse, VehiculoValido } from "@/types/cotizacion"
import { cotizacionMasivaService } from "@/services/cotizacionMasivaService"

interface CatalogoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onValidationComplete: (result: { nombreLote: string; estadoInicial: "EN_PROCESO" | "EN_COLA" }) => void
}

export default function CatalogoUploadModal({ isOpen, onClose, onValidationComplete }: CatalogoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidacionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cotizacionResult, setCotizacionResult] = useState<{
    nombreLote: string
    estadoInicial: "EN_PROCESO" | "EN_COLA"
  } | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setFile(file)
      setError(null)
    } else {
      setError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const data = await cotizacionMasivaService.validarExcel(file)
      setValidationResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (!validationResult) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await cotizacionMasivaService.procesarCotizacion(validationResult.vehiculosValidos)
      setCotizacionResult({
        nombreLote: result.nombreLote,
        estadoInicial: result.estadoInicial
      })
      onValidationComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la cotización')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setValidationResult(null)
    setError(null)
    setCotizacionResult(null)
    console.log("handleClose del modal ejecutado");
    onClose();
  }

  const getValidationStats = () => {
    if (!validationResult) return null

    const total = validationResult.resumenValidacion.resultadosValidacion.length
    const validos = validationResult.resumenValidacion.resultadosValidacion.filter(r => r.estado === 'VALIDO').length
    const errores = total - validos

    return { total, validos, errores }
  }

  console.log("Modal renderizado, isOpen:", isOpen);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar archivo Excel</DialogTitle>
        </DialogHeader>

        {!validationResult ? (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-[#8BC34A] bg-[#F8FFF8]' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-[#8BC34A]">Suelta el archivo aquí...</p>
              ) : (
                <div>
                  <p className="text-gray-600">Arrastra y suelta tu archivo Excel aquí, o</p>
                  <Button variant="link" className="text-[#8BC34A]">
                    selecciona un archivo
                  </Button>
                </div>
              )}
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-[#8BC34A] hover:bg-[#7CB342] text-white"
              >
                {isUploading ? 'Validando...' : 'Validar archivo'}
              </Button>
            </DialogFooter>
          </div>
        ) : !cotizacionResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {getValidationStats() && (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total registros</p>
                    <p className="text-xl font-semibold">{getValidationStats()?.total}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-green-600">Registros válidos</p>
                    <p className="text-xl font-semibold text-green-600">{getValidationStats()?.validos}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-sm text-red-600">Registros con error</p>
                    <p className="text-xl font-semibold text-red-600">{getValidationStats()?.errores}</p>
                  </div>
                </>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto">
              {validationResult.resumenValidacion.resultadosValidacion.map((resultado, index) => (
                <div
                  key={index}
                  className={`p-3 mb-2 rounded-lg flex items-start space-x-3 ${
                    resultado.estado === 'VALIDO' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {resultado.estado === 'VALIDO' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      Fila {resultado.fila}: {resultado.estado}
                    </p>
                    {resultado.errores.length > 0 && (
                      <ul className="mt-1 text-sm text-red-600">
                        {resultado.errores.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="bg-[#8BC34A] hover:bg-[#7CB342] text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Continuar con registros válidos'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-medium text-green-800">Cotización iniciada correctamente</h3>
                  <p className="text-sm text-green-600 mt-1">
                    Nombre del lote: {cotizacionResult.nombreLote}
                  </p>
                  <p className="text-sm text-green-600">
                    Estado: {cotizacionResult.estadoInicial === 'EN_PROCESO' ? 'En proceso' : 'En cola'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#8BC34A] hover:bg-[#7CB342] text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 