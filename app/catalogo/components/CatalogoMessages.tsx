import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface CatalogoMessagesProps {
  uploadError: string | null
  uploadSuccess: string | null
}

export default function CatalogoMessages({ uploadError, uploadSuccess }: CatalogoMessagesProps) {
  return (
    <>
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
    </>
  )
} 