export interface ResultadoValidacion {
  fila: number
  estado: "VALIDO" | "ERROR"
  errores: string[]
}

export interface ResumenValidacion {
  resultadosValidacion: ResultadoValidacion[]
}

export interface VehiculoRequestDTO {
  vBrand: string
  vSubBrand: string
  vModel: string
  vDescription: string
  vSexoPersona: string
  vFechaNacimientoPersona: string
  vCodigoPostalPersona: string
}

export interface VehiculoValido {
  vehiculoRequestDTO: VehiculoRequestDTO
  aseguradoras: number[]
}

export interface ValidacionResponse {
  resumenValidacion: ResumenValidacion
  vehiculosValidos: VehiculoValido[]
} 