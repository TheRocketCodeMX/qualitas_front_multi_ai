import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PriceInfo {
  price: string
  insurer: string
  logo: string
}

interface PlanSelectorProps {
  selectedPlan: "amplia" | "limitada" | "rc"
  onPlanChange: (plan: "amplia" | "limitada" | "rc") => void
  lowestPrices: {
    amplia: PriceInfo | null
    limitada: PriceInfo | null
    rc: PriceInfo | null
  }
}

export function PlanSelector({ selectedPlan, onPlanChange, lowestPrices }: PlanSelectorProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-4">
      <div className="lg:col-span-1">
        <Select defaultValue="anual">
          <SelectTrigger className="w-full border-gray-300 focus:border-[#8BC34A] focus:ring-[#8BC34A]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anual">Plan anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lg:col-span-3 flex">
        <div
          className={`flex-1 text-center p-4 rounded-l-lg cursor-pointer transition-all ${
            selectedPlan === "amplia"
              ? "bg-[#8BC34A] text-white"
              : "bg-white border-t border-b border-l border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onPlanChange("amplia")}
        >
          <div className="text-base font-medium">Amplia</div>
          <div className="text-xl font-bold mt-1">
            {lowestPrices.amplia?.price || "-"}
          </div>
        </div>
        <div
          className={`flex-1 text-center p-4 cursor-pointer transition-all ${
            selectedPlan === "limitada"
              ? "bg-[#8BC34A] text-white"
              : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onPlanChange("limitada")}
        >
          <div className="text-base font-medium">Limitada</div>
          <div className="text-xl font-bold mt-1">
            {lowestPrices.limitada?.price || "-"}
          </div>
        </div>
        <div
          className={`flex-1 text-center p-4 rounded-r-lg cursor-pointer transition-all ${
            selectedPlan === "rc"
              ? "bg-[#8BC34A] text-white"
              : "bg-white border-t border-b border-r border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onPlanChange("rc")}
        >
          <div className="text-base font-medium">Responsabilidad civil</div>
          <div className="text-xl font-bold mt-1">
            {lowestPrices.rc?.price || "-"}
          </div>
        </div>
      </div>
    </div>
  )
} 