import React from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"

interface CatalogoActionsProps {
  onDownloadLayout: () => void
  onOpenUploadModal: () => void
  isUploading: boolean
}

export default function CatalogoActions({ onDownloadLayout, onOpenUploadModal, isUploading }: CatalogoActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white" onClick={onDownloadLayout}>
        <Download className="h-4 w-4 mr-2" />
        Descargar Layout
      </Button>

      <Button 
        variant="outline" 
        className="border-gray-300 text-gray-700"
        onClick={onOpenUploadModal}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? "Cargando..." : "Cargar Base"}
      </Button>
    </div>
  )
} 