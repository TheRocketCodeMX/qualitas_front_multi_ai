import { ValidacionResponse, VehiculoValido } from "../types/cotizacion"
import { getApiUrl, getEndpoint } from '../lib/config';

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

    const apiUrl = getApiUrl('cotizacion');
    const endpoint = getEndpoint('cotizacion', 'cargarExcel');

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Error al cargar el archivo")
    }

    return response.json()
  },

  procesarCotizacion: async (vehiculosValidos: VehiculoValido[]): Promise<{ nombreLote: string; estadoInicial: "EN_PROCESO" | "EN_COLA" }> => {
    const apiUrl = getApiUrl('cotizacion');
    const endpoint = getEndpoint('cotizacion', 'cotizar');

    const response = await fetch(`${apiUrl}${endpoint}`, {
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
    const apiUrl = getApiUrl('cotizacion');
    const endpoint = getEndpoint('cotizacion', 'consultarEstado');

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Error al consultar el estado")
    }

    return response.json()
  },

  consultarEstadoLote: async (idLote: number): Promise<EstadoLoteResponse> => {
    const apiUrl = getApiUrl('cotizacion');
    const endpoint = getEndpoint('cotizacion', 'consultarEstadoLote', idLote);

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Error al consultar el estado del lote")
    }

    return response.json()
  }
} 