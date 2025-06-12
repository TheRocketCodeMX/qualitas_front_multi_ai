import { Card, CardContent } from "@/components/ui/card"

interface VehicleData {
  marca: string
  año: string
  modelo: string
  descripcion: string
}

interface UserData {
  genero: string
  fechaNacimiento: string
  codigoPostal: string
}

interface VehicleUserInfoProps {
  vehicleData: VehicleData
  userData: UserData
}

export function VehicleUserInfo({ vehicleData, userData }: VehicleUserInfoProps) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">
              {vehicleData.marca} - {vehicleData.año} - {vehicleData.modelo} - {vehicleData.descripcion}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">
              {userData.genero} - {userData.fechaNacimiento} - {userData.codigoPostal}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 