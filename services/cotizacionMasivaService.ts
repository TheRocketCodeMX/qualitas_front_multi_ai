import { ValidacionResponse, VehiculoValido } from "../types/cotizacion"

const API_URL = "http://localhost:8080/cotizacion-api/api/cotizacion-masiva"

export interface EstadoLoteResponse {
  idLote: number
  nombreLote: string
  estadoLoteId: number
  estadoLote: "COMPLETADO" | "EN_PROCESO"
  totalCotizaciones: number
  cotizacionesExitosas: number
  cotizacionesError: number
  cotizacionesPendientes: number
  fechaCreacion: number
  fechaCreacionStr: string
}

export interface EstadoCotizacionResponse {
  lotesEnProceso: number
  lotes: EstadoLoteResponse[]
  lotesConError: number
  lotesCompletados: number
  totalLotes: number
}

export const cotizacionMasivaService = {
  validarExcel: async (file: File): Promise<ValidacionResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_URL}/cargar-excel`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Error al cargar el archivo")
    }

    return response.json()
  },

  procesarCotizacion: async (vehiculosValidos: VehiculoValido[]): Promise<{ nombreLote: string; estadoInicial: "EN_PROCESO" | "EN_COLA" }> => {
    const response = await fetch(`${API_URL}/cotizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vehiculosValidos),
    })

    if (!response.ok) {
      throw new Error("Error al procesar la cotización")
    }

    return response.json()
  },

  consultarEstado: async (): Promise<EstadoCotizacionResponse> => {
    const response = await fetch(`${API_URL}/consultar-estado`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Error al consultar el estado")
    }

    return response.json()
  },

  consultarEstadoLote: async (idLote: number): Promise<EstadoLoteResponse> => {
    const response = await fetch(`${API_URL}/consultar-estado/${idLote}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Error al consultar el estado del lote")
    }

    return response.json()
  }
} 