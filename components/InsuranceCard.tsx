import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { CoverageDetails } from "./CoverageDetails"

interface InsuranceCardProps {
  insurer: {
    id: string
    name: string
    logo: string
    prices?: Record<string, string>
    deductible?: string
    medicalExpenses?: string
    coveragesRaw?: Record<string, any>
    isError: boolean
    isLoading: boolean
    isHighlighted: boolean
    errorMessage?: string
  }
  selectedPlan: "amplia" | "limitada" | "rc"
  isExpanded: boolean
  onToggleExpand: () => void
}

export function InsuranceCard({ insurer, selectedPlan, isExpanded, onToggleExpand }: InsuranceCardProps) {
  return (
    <div>
      <Card className={`border ${insurer.isHighlighted ? "border-[#8BC34A] bg-[#F8FFF8]" : "border-gray-200"} ${insurer.isError ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <div className="h-10 w-20 relative">
                <Image
                  src={insurer.logo || "/placeholder.svg"}
                  alt={`Logo de ${insurer.name}`}
                  fill
                  style={{ objectFit: "contain", objectPosition: "left" }}
                />
              </div>
            </div>
            {insurer.isError ? (
              <div className="col-span-3 text-center">
                <span className="text-red-600 font-semibold text-xs">
                  {insurer.errorMessage || "Datos no disponibles para esta aseguradora"}
                </span>
              </div>
            ) : (
              <>
                <div className="font-bold text-lg text-[#8BC34A] text-center">
                  {insurer.isLoading ? (
                    <Skeleton className="mx-auto h-6 w-20 rounded bg-gray-200" />
                  ) : (
                    insurer.prices?.[selectedPlan] ?? "-"
                  )}
                </div>
                <div className="text-gray-600 text-center">
                  {insurer.isLoading ? (
                    <Skeleton className="mx-auto h-5 w-16 rounded bg-gray-200" />
                  ) : (
                    insurer.deductible ?? "-"
                  )}
                </div>
                <div className="text-gray-600 text-center">
                  {insurer.isLoading ? (
                    <Skeleton className="mx-auto h-5 w-16 rounded bg-gray-200" />
                  ) : (
                    insurer.medicalExpenses ?? "-"
                  )}
                </div>
              </>
            )}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-[#8BC34A] border-[#8BC34A] flex items-center gap-1"
                onClick={onToggleExpand}
                disabled={insurer.isError || insurer.isLoading}
              >
                Coberturas
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Coverage Details */}
      {isExpanded && !insurer.isError && !insurer.isLoading && (
        <CoverageDetails coverageObj={insurer.coveragesRaw?.[selectedPlan]} />
      )}
    </div>
  )
} 