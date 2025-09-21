import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ServiceTicketDetail } from "@/components/volantes/service-ticket-detail"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ServiceTicketDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <DashboardLayout>
      <ServiceTicketDetail ticketId={id} />
    </DashboardLayout>
  )
}
