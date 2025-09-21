import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ServiceTicketsTable } from "@/components/volantes/service-tickets-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ServiceTicketsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volantes de Servicio</h1>
            <p className="text-gray-600">Gestiona y revisa todos los volantes de servicio</p>
          </div>
          <Link href="/volantes/crear">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Crear Volante
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Volantes</CardTitle>
            <CardDescription>Lista de todos los volantes de servicio registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTicketsTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
