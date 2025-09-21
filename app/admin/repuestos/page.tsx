import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PartsTable } from "@/components/admin/parts-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PartsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Repuestos</h1>
            <p className="text-gray-600">Administra el catálogo de repuestos y partes disponibles</p>
          </div>
          <Link href="/admin/repuestos/crear">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Repuesto
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Repuestos</CardTitle>
            <CardDescription>Lista de todos los repuestos disponibles para servicios técnicos</CardDescription>
          </CardHeader>
          <CardContent>
            <PartsTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
