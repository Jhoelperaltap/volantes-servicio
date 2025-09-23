import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { HierarchyManagement } from "@/components/admin/hierarchy-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function LocationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión Jerárquica</h1>
            <p className="text-gray-600">Administra empresas, clientes, localidades y equipos de forma organizada</p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nueva estructura jerárquica: <strong>Empresa</strong> → <strong>Cliente</strong> →{" "}
            <strong>Localidad</strong> → <strong>Equipo</strong>. Gestiona cada nivel de forma independiente usando las
            pestañas.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Estructura Organizacional</CardTitle>
            <CardDescription>
              Gestiona la jerarquía completa de empresas, clientes, localidades y equipos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HierarchyManagement />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
