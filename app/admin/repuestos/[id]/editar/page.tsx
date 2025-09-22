import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditPartForm } from "@/components/admin/edit-part-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EditPartPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPartPage({ params }: EditPartPageProps) {
  const { id } = await params

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Repuesto</h1>
          <p className="text-gray-600">Modifica la información del repuesto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Repuesto</CardTitle>
            <CardDescription>Actualiza los datos técnicos del repuesto</CardDescription>
          </CardHeader>
          <CardContent>
            <EditPartForm partId={id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
