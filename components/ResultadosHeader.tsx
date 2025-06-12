import { Button } from "@/components/ui/button"
import { Download, Plus } from "lucide-react"

interface ResultadosHeaderProps {
  onDownloadExcel: () => void
  onNuevaCotizacion: () => void
}

export function ResultadosHeader({ onDownloadExcel, onNuevaCotizacion }: ResultadosHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cotizador manual</h1>
        {/* <p className="text-gray-600 mt-1">Lorem ipsum dolor sit amet consectetur.</p> */}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A] hover:text-white px-6 py-2"
          onClick={onDownloadExcel}
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar Excel
        </Button>
        <Button
          className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-6 py-2 shadow-sm"
          onClick={onNuevaCotizacion}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva cotización
        </Button>
      </div>
    </div>
  )
} 