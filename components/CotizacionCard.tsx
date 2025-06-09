import React from "react"

interface CotizacionCardProps {
  cotizacion: {
    clave: string
    nombreSeguro: string
    nombreCobertura: string
    precioTotal: number
    plazoCobertura: string
    danosTerceros: number
    roboTotal: number
    roboParcial: number
    gastosMedicos: number
    fallecimiento: number
    defensaLegal: boolean
    asistenciaVial: boolean
    danosVehiculo: boolean
    estado: string
  }
}

function formatMoneda(valor: number) {
  return valor ? valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "-"
}

function formatPlazo(plazo: string) {
  if (plazo.toUpperCase() === "ANUAL") return "1 año"
  return plazo
}

function formatIncluido(valor: number | boolean) {
  if (typeof valor === "boolean") return valor ? "Incluido" : "No incluido"
  return valor > 0 ? "Incluido" : "No incluido"
}

function formatFallecimiento(valor: number) {
  if (valor < 1000) return valor + "%"
  return formatMoneda(valor)
}

export const CotizacionCard: React.FC<CotizacionCardProps> = ({ cotizacion }) => {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm max-w-xl mx-auto mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="block text-xs text-gray-500 font-medium">Cotización Clave</span>
          <span className="block text-base font-semibold text-gray-900">{cotizacion.clave}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Nombre del Seguro</span>
          <span className="block text-base font-semibold text-gray-900">{cotizacion.nombreSeguro}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Nombre de la Cobertura</span>
          <span className="block text-base text-gray-900">{cotizacion.nombreCobertura}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Precio Total</span>
          <span className="block text-base font-bold text-[#8BC34A]">{formatMoneda(cotizacion.precioTotal)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Plazo de la Cobertura</span>
          <span className="block text-base text-gray-900">{formatPlazo(cotizacion.plazoCobertura)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Daños a Terceros</span>
          <span className="block text-base text-gray-900">{formatMoneda(cotizacion.danosTerceros)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Robo Total</span>
          <span className="block text-base text-gray-900">{formatIncluido(cotizacion.roboTotal)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Robo Parcial</span>
          <span className="block text-base text-gray-900">{formatIncluido(cotizacion.roboParcial)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Gastos Médicos</span>
          <span className="block text-base text-gray-900">{formatMoneda(cotizacion.gastosMedicos)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Fallecimiento</span>
          <span className="block text-base text-gray-900">{formatFallecimiento(cotizacion.fallecimiento)}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Defensa Legal</span>
          <span className={`block text-base font-semibold ${cotizacion.defensaLegal ? "text-green-600" : "text-red-600"}`}>{cotizacion.defensaLegal ? "Sí" : "No"}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Asistencia Vial</span>
          <span className={`block text-base font-semibold ${cotizacion.asistenciaVial ? "text-green-600" : "text-red-600"}`}>{cotizacion.asistenciaVial ? "Sí" : "No"}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium">Daños al Vehículo</span>
          <span className="block text-base text-gray-900">{formatIncluido(cotizacion.danosVehiculo)}</span>
        </div>
      </div>
      <div className="pt-4 border-t mt-4 text-center">
        <span className={`inline-block px-4 py-2 rounded font-bold text-sm ${cotizacion.estado === "Completado" ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700"}`}>
          {cotizacion.estado}
        </span>
      </div>
    </div>
  )
}
