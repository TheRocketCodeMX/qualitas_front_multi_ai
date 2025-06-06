export interface User {
  id: string
  email: string
  name: string
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface QuoteRequest {
  insuranceType: "auto" | "home" | "life" | "health"
  personalInfo: {
    age: number
    gender: "M" | "F"
    location: string
    currentInsurer?: string
  }
  vehicleInfo?: {
    brand: string
    model: string
    year: number
    value: number
  }
  propertyInfo?: {
    propertyType: string
    value: number
    location: string
  }
}

export interface Quote {
  id: string
  insurerName: "GNP" | "Chubb" | "Mapfre" | "HDI" | "AXA"
  monthlyPremium: number
  annualPremium: number
  coverage: {
    liability: number
    collision: number
    comprehensive: number
  }
  benefits: string[]
  deductible: number
  score: number
  isRecommended: boolean
  contactInfo: {
    phone: string
    email: string
    agent?: string
  }
}

export interface QuoteComparison {
  requestId: string
  quotes: Quote[]
  currentInsurerQuote?: Quote
  bestOption: Quote
  potentialSavings: number
  createdAt: Date
}
