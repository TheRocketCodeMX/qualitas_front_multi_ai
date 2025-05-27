"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuthGuard()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8BC34A]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const chartData = [
    { month: "Ene", CHUBB: 45, HDI: 35, MAPFRE: 20 },
    { month: "Feb", CHUBB: 40, HDI: 42, MAPFRE: 15 },
    { month: "Mar", CHUBB: 55, HDI: 25, MAPFRE: 25 },
    { month: "Abr", CHUBB: 42, HDI: 38, MAPFRE: 30 },
    { month: "May", CHUBB: 48, HDI: 45, MAPFRE: 35 },
    { month: "Jun", CHUBB: 35, HDI: 40, MAPFRE: 42 },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Métricas de uso</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Promedio de tiempo */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-gray-600">Promedio de tiempo de ejecución</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8BC34A]">2 horas 30 minutos</div>
            </CardContent>
          </Card>

          {/* Total de procesos */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-gray-600">Total de procesos creados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8BC34A]">50 procesos</div>
            </CardContent>
          </Card>

          {/* Porcentaje de éxito */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-gray-600">Porcentaje de éxito en la consulta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#8BC34A"
                      strokeWidth="2"
                      strokeDasharray="90, 100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">90%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultas por portal */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-gray-600">Consultas por portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-[#60A5FA] rounded-full"></div>
                    <span>CHUBB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-[#F59E0B] rounded-full"></div>
                    <span>HDI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-[#8BC34A] rounded-full"></div>
                    <span>MAPFRE</span>
                  </div>
                </div>

                {/* Simple bar chart representation */}
                <div className="space-y-2">
                  {chartData.map((data, index) => (
                    <div key={data.month} className="flex items-center space-x-2">
                      <span className="text-xs w-8 text-gray-600">{data.month}</span>
                      <div className="flex-1 flex space-x-1">
                        <div
                          className="bg-[#60A5FA] h-4 rounded-sm"
                          style={{ width: `${(data.CHUBB / 60) * 100}%` }}
                        ></div>
                        <div
                          className="bg-[#F59E0B] h-4 rounded-sm"
                          style={{ width: `${(data.HDI / 60) * 100}%` }}
                        ></div>
                        <div
                          className="bg-[#8BC34A] h-4 rounded-sm"
                          style={{ width: `${(data.MAPFRE / 60) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
