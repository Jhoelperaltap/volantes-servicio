import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PartForm } from "@/components/admin/part-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreatePartPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Repuesto</h1>
          <p className="text-gray-600">Registra un nuevo repuesto en el catálogo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Repuesto</CardTitle>
            <CardDescription>Complete todos los datos técnicos del repuesto</CardDescription>
          </CardHeader>
          <CardContent>
            <PartForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
