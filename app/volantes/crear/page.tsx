import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ServiceTicketForm } from "@/components/volantes/service-ticket-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateTicketPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Volante de Servicio</h1>
          <p className="text-gray-600">Complete la información del servicio técnico realizado</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo Volante de Servicio</CardTitle>
            <CardDescription>
              Registre los detalles del servicio técnico. Una vez enviado, el volante no podrá ser modificado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTicketForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
