import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CatalogoPaginationProps {
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  onPageClick: (page: number) => void
}

export default function CatalogoPagination({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageClick,
}: CatalogoPaginationProps) {
  return (
    <div className="flex items-center justify-center py-4 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
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
              onClick={() => onPageClick(page)}
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
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="h-8 px-2 text-[#8BC34A] border-[#8BC34A]"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
} 