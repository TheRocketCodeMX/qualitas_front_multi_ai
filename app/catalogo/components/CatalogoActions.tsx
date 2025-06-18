import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"
import CatalogoUploadModal from "./CatalogoUploadModal"

interface CatalogoActionsProps {
  onDownloadLayout: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
}

export default function CatalogoActions({ onDownloadLayout, onFileUpload, isUploading }: CatalogoActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleValidationComplete = (vehiculosValidos: any[]) => {
    // Aquí manejaremos la lógica para procesar los vehículos válidos
    console.log('Vehículos válidos:', vehiculosValidos)
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-3">
        <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white" onClick={onDownloadLayout}>
          <Download className="h-4 w-4 mr-2" />
          Descargar Layout
        </Button>

        <Button 
          variant="outline" 
          className="border-gray-300 text-gray-700"
          onClick={() => setIsModalOpen(true)}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Cargando..." : "Cargar Base"}
        </Button>
      </div>

      <CatalogoUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onValidationComplete={handleValidationComplete}
      />
    </>
  )
} 