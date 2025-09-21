import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LocationForm } from "@/components/admin/location-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateLocationPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Localidad</h1>
          <p className="text-gray-600">Registra una nueva localidad para servicios técnicos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Localidad</CardTitle>
            <CardDescription>Complete todos los datos de contacto y ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <LocationForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
