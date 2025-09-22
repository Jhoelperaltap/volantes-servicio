import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditUserForm } from "@/components/admin/edit-user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="text-gray-600">Modifica la información del usuario</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Actualiza los datos del usuario seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <EditUserForm userId={id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
