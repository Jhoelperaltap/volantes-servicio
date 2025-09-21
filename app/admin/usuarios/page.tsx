import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UsersTable } from "@/components/admin/users-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra técnicos y usuarios del sistema</p>
          </div>
          <Link href="/admin/usuarios/crear">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Sistema</CardTitle>
            <CardDescription>Lista de todos los usuarios registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
