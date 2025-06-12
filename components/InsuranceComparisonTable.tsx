import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InsuranceCard } from "./InsuranceCard"

interface Insurer {
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
}

interface InsuranceComparisonTableProps {
  insurers: Insurer[]
  selectedPlan: "amplia" | "limitada" | "rc"
  sortOrder: "default" | "asc" | "desc"
  expandedInsurers: { [id: string]: boolean }
  onSortOrderChange: (order: "default" | "asc" | "desc") => void
  onToggleExpand: (insurerId: string) => void
}

export function InsuranceComparisonTable({
  insurers,
  selectedPlan,
  sortOrder,
  expandedInsurers,
  onSortOrderChange,
  onToggleExpand,
}: InsuranceComparisonTableProps) {
  // Ordenar aseguradoras por precio del plan seleccionado
  const sortedInsurers = insurers.slice().sort((a, b) => {
    // Si alguno tiene error, lo manda al final
    if (a.isError && !b.isError) return 1
    if (!a.isError && b.isError) return -1
    if (a.isError && b.isError) return 0

    // Ambos tienen prices
    const priceA =
      a.prices && a.prices[selectedPlan]
        ? Number.parseFloat(a.prices[selectedPlan].replace(/[$,]/g, ""))
        : Number.POSITIVE_INFINITY
    const priceB =
      b.prices && b.prices[selectedPlan]
        ? Number.parseFloat(b.prices[selectedPlan].replace(/[$,]/g, ""))
        : Number.POSITIVE_INFINITY

    return sortOrder === "desc" ? priceB - priceA : priceA - priceB
  })

  return (
    <div className="space-y-4">
      {/* Header with Sort Filter */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 px-4 flex-1">
          <div>Aseguradora</div>
          <div>Prima anual</div>
          <div>Deducible robo total</div>
          <div>Gastos médicos</div>
        </div>
        <div className="ml-4">
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-48 border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
              <SelectValue placeholder="Ordenar por precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Por defecto</SelectItem>
              <SelectItem value="asc">Menor a mayor precio</SelectItem>
              <SelectItem value="desc">Mayor a menor precio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Insurance Cards */}
      {sortedInsurers.map((insurer) => (
        <InsuranceCard
          key={insurer.id}
          insurer={insurer}
          selectedPlan={selectedPlan}
          isExpanded={!!expandedInsurers[insurer.id]}
          onToggleExpand={() => onToggleExpand(insurer.id)}
        />
      ))}
    </div>
  )
} 