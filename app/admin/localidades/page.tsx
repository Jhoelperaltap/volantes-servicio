import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LocationsTable } from "@/components/admin/locations-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function LocationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Localidades</h1>
            <p className="text-gray-600">Administra las localidades donde se brindan servicios técnicos</p>
          </div>
          <Link href="/admin/localidades/crear">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Localidad
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Localidades Registradas</CardTitle>
            <CardDescription>Lista de todas las localidades donde se realizan servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <LocationsTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
