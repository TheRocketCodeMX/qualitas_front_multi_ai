import * as XLSX from "xlsx"

export interface VehicleData {
  marca: string
  año: string
  modelo: string
  descripcion: string
}

export interface UserData {
  genero: string
  fechaNacimiento: string
  codigoPostal: string
}

export interface Insurer {
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
  errorImageUrl?: string
}

export interface PriceInfo {
  price: string
  insurer: string
  logo: string
}

export class CotizacionService {
  private static instance: CotizacionService

  private constructor() {}

  public static getInstance(): CotizacionService {
    if (!CotizacionService.instance) {
      CotizacionService.instance = new CotizacionService()
    }
    return CotizacionService.instance
  }

  public getInsurersFromResults(cotizacionResultados: any[]): Insurer[] {
    return cotizacionResultados.map((res) => {
      if (res.loading) {
        return {
          id: res.insurer.toLowerCase(),
          name: res.insurer,
          logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
          isLoading: true,
          isError: false,
          isHighlighted: false,
        }
      }

      if (res.data && res.data.success === false) {
        let errorMessage = "Datos no disponibles para esta aseguradora"
        
        if (res.data.status === 404) {
          errorMessage = "Servicio no disponible temporalmente"
        } else if (res.data.message) {
          errorMessage = res.data.message
        }

        return {
          id: res.insurer.toLowerCase(),
          name: res.insurer,
          logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
          errorMessage,
          errorImageUrl: res.data.url_image || undefined,
          isError: true,
          isLoading: false,
          isHighlighted: false,
        }
      }

      let resultado = res.data?.resultado?.[0] || {}
      let isHDI = res.insurer.toLowerCase() === "hdi"
      let prices, deductible, medicalExpenses, coveragesRaw

      if (isHDI) {
        prices = {
          amplia: resultado.PREMIUM?.dPrecioTotal ? `$${resultado.PREMIUM.dPrecioTotal}` : "-",
          limitada: resultado.AMPLIA?.dPrecioTotal ? `$${resultado.AMPLIA.dPrecioTotal}` : "-",
          rc: resultado.LIMITADA?.dPrecioTotal ? `$${resultado.LIMITADA.dPrecioTotal}` : "-",
        }
        deductible = resultado.PREMIUM?.iDanoVehiculo !== undefined ? `${resultado.PREMIUM.iDanoVehiculo}%` : "-"
        medicalExpenses = resultado.PREMIUM?.dGastosMedicos || "-"
        coveragesRaw = {
          amplia: resultado.PREMIUM || {},
          limitada: resultado.AMPLIA || {},
          rc: resultado.LIMITADA || {},
        }
      } else {
        prices = {
          amplia: resultado.AMPLIA?.dPrecioTotal ? `$${resultado.AMPLIA.dPrecioTotal}` : "-",
          limitada: resultado.LIMITADA?.dPrecioTotal ? `$${resultado.LIMITADA.dPrecioTotal}` : "-",
          rc: resultado.PREMIUM?.dPrecioTotal ? `$${resultado.PREMIUM.dPrecioTotal}` : "-",
        }
        deductible = resultado.AMPLIA?.deductible || "-"
        medicalExpenses = resultado.AMPLIA?.dGastosMedicos || "-"
        coveragesRaw = {
          amplia: resultado.AMPLIA || {},
          limitada: resultado.LIMITADA || {},
          rc: resultado.PREMIUM || {},
        }
      }

      return {
        id: res.insurer.toLowerCase(),
        name: res.insurer,
        logo: `/images/${res.insurer.toLowerCase()}-logo.png`,
        prices,
        deductible,
        medicalExpenses,
        coveragesRaw,
        isHighlighted: false,
        isError: false,
        isLoading: false,
      }
    })
  }

  public getLowestPriceAndInsurer(insurers: Insurer[], plan: "amplia" | "limitada" | "rc"): PriceInfo | null {
    let minPrice = Number.POSITIVE_INFINITY
    let minInsurer: Insurer | null = null

    insurers.forEach((insurer) => {
      if (insurer.isError || insurer.isLoading) return
      const priceStr = insurer.prices?.[plan]
      if (!priceStr || priceStr === "-") return
      const price = Number.parseFloat(priceStr.replace(/[$,]/g, ""))
      if (price < minPrice) {
        minPrice = price
        minInsurer = insurer
      }
    })

    if (minInsurer && minPrice !== Number.POSITIVE_INFINITY) {
      return {
        price: `$${minPrice.toLocaleString("es-MX")}`,
        insurer: minInsurer.name,
        logo: minInsurer.logo,
      }
    }

    return null
  }

  public generateExcel(
    insurers: Insurer[],
    vehicleData: VehicleData,
    userData: UserData
  ): void {
    try {
      const vehicleInfo = `${vehicleData.marca || "-"} - ${vehicleData.año || "-"} - ${vehicleData.modelo || "-"} - ${vehicleData.descripcion || "-"}`
      const userInfo = `${userData.genero || "-"} - ${userData.fechaNacimiento || "-"} - ${userData.codigoPostal || "-"}`

      const headers = [
        "Vehículo",
        "Usuario",
        "Aseguradora",
        "Plan",
        "Cobertura",
        "Precio Total",
        "Plazo",
        "Daños a Terceros",
        "Robo Total",
        "Robo Parcial",
        "Gastos Médicos",
        "Fallecimiento",
        "Defensa Legal",
        "Asistencia Vial",
        "Daños al Vehículo"
      ]

      const excelData = [headers]
      const planLabels: Array<{ key: "amplia" | "limitada" | "rc"; label: string }> = [
        { key: "amplia", label: "Amplia" },
        { key: "limitada", label: "Limitada" },
        { key: "rc", label: "RC" }
      ]

      insurers.forEach((insurer) => {
        if (insurer.isError || insurer.isLoading || !insurer.coveragesRaw) return
        const coveragesRaw = insurer.coveragesRaw
        planLabels.forEach(({ key, label }) => {
          const cov = coveragesRaw[key]
          if (!cov) return
          excelData.push([
            vehicleInfo,
            userInfo,
            insurer.name,
            label,
            cov.vNombreCobertura ?? "-",
            cov.dPrecioTotal ?? "-",
            cov.vPlazoCobertura ?? "-",
            cov.dDanosTerceros ?? "-",
            cov.iRoboTotal ?? "-",
            cov.iRoboParcial ?? "-",
            cov.dGastosMedicos ?? "-",
            cov.dFallecimiento ?? "-",
            cov.bDefensaLegal === "true" || cov.bDefensaLegal === true ? "Sí" : "No",
            cov.bAsistencialVialCarretera === "true" || cov.bAsistencialVialCarretera === true ? "Sí" : "No",
            cov.iDanoVehiculo ?? "-"
          ])
        })
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      ws["!cols"] = [
        { wch: 35 }, // Vehículo
        { wch: 35 }, // Usuario
        { wch: 15 }, // Aseguradora
        { wch: 10 }, // Plan
        { wch: 20 }, // Cobertura
        { wch: 15 }, // Precio Total
        { wch: 10 }, // Plazo
        { wch: 18 }, // Daños a Terceros
        { wch: 12 }, // Robo Total
        { wch: 15 }, // Robo Parcial
        { wch: 15 }, // Gastos Médicos
        { wch: 15 }, // Fallecimiento
        { wch: 15 }, // Defensa Legal
        { wch: 18 }, // Asistencia Vial
        { wch: 15 }, // Daños al Vehículo
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Cotización Detallada")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `cotizacion_detallada_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error)
      throw new Error("Error al generar el archivo. Inténtalo de nuevo.")
    }
  }

  public sortInsurers(
    insurers: Insurer[],
    selectedPlan: "amplia" | "limitada" | "rc",
    sortOrder: "default" | "asc" | "desc"
  ): Insurer[] {
    return insurers.slice().sort((a, b) => {
      if (a.isError && !b.isError) return 1
      if (!a.isError && b.isError) return -1
      if (a.isError && b.isError) return 0

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
  }
} 