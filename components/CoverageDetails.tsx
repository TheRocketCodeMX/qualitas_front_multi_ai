interface CoverageDetailsProps {
  coverageObj: any
}

export function CoverageDetails({ coverageObj }: CoverageDetailsProps) {
  const formatMoneda = (valor: number | string) => {
    if (!valor) return "-"
    const num = parseFloat(valor as string)
    return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPlazo = (plazo: string) => (plazo.toUpperCase() === "ANUAL" ? "1 año" : plazo)

  const formatIncluido = (valor: number | boolean, esMoneda: boolean = false) => {
    if (typeof valor === "boolean") return valor ? "Incluido" : "No incluido"
    if (valor === 0) return "No incluido"
    return esMoneda ? formatMoneda(valor) : `${valor}%`
  }

  const formatFallecimiento = (valor: number | string) => {
    const num = parseFloat(valor as string)
    return num < 1000 ? `${num}%` : formatMoneda(num)
  }

  const getLabelClass = (val: boolean) =>
    val ? "text-green-600 font-semibold" : "text-red-600 font-semibold"

  if (!coverageObj || Object.keys(coverageObj).length === 0) {
    return <div className="text-gray-500">No hay datos disponibles para esta cobertura.</div>
  }

  return (
    <div className="w-full px-4 mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la cobertura seleccionada</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Cobertura</p>
          <p className="text-gray-900">{coverageObj.vNombreCobertura}</p>
        </div>
        <div>
          <p className="text-gray-500">Precio Total</p>
          <p className="font-bold text-[#8BC34A]">{formatMoneda(coverageObj.dPrecioTotal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Plazo</p>
          <p className="text-gray-900">{formatPlazo(coverageObj.vPlazoCobertura)}</p>
        </div>
        <div>
          <p className="text-gray-500">Daños a Terceros</p>
          <p className="text-gray-900">{formatMoneda(coverageObj.dDanosTerceros)}</p>
        </div>
        <div>
          <p className="text-gray-500">Deducible Robo Total</p>
          <p className="text-gray-900">{formatIncluido(coverageObj.iRoboTotal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Cobertura Robo Parcial</p>
          <p className="text-gray-900">{formatMoneda(coverageObj.iRoboParcial)}</p>
        </div>
        <div>
          <p className="text-gray-500">Gastos Médicos</p>
          <p className="text-gray-900">{formatMoneda(coverageObj.dGastosMedicos)}</p>
        </div>
        <div>
          <p className="text-gray-500">Fallecimiento</p>
          <p className="text-gray-900">{formatFallecimiento(coverageObj.dFallecimiento)}</p>
        </div>
        <div>
          <p className="text-gray-500">Defensa Legal</p>
          <p className={getLabelClass(coverageObj.bDefensaLegal === "true" || coverageObj.bDefensaLegal === true)}>
            {coverageObj.bDefensaLegal === "true" || coverageObj.bDefensaLegal === true ? "Sí" : "No"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Asistencia Vial</p>
          <p className={getLabelClass(coverageObj.bAsistencialVialCarretera === "true" || coverageObj.bAsistencialVialCarretera === true)}>
            {coverageObj.bAsistencialVialCarretera === "true" || coverageObj.bAsistencialVialCarretera === true ? "Sí" : "No"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Daños al Vehículo</p>
          <p className="text-gray-900">{formatIncluido(coverageObj.iDanoVehiculo)}</p>
        </div>
      </div>
    </div>
  )
} 