"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Printer, ArrowLeft, MapPin, User, Calendar, Package, Mail, ImageIcon, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ServiceTicketData {
  id: string
  ticket_number: number
  service_type: string
  description: string
  work_performed: string
  parts_used: any[]
  status: string
  requires_return: boolean
  pending_items: string
  technician_signature: string
  client_signature: string
  technician_signed_at: string
  client_signed_at: string
  completed_at: string
  created_at: string
  image_url?: string // Added optional image_url field
  location: {
    name: string
    address: string
    contact_person: string
    contact_phone: string
  }
  technician: {
    name: string
    email: string
  }
}

interface ServiceTicketDetailProps {
  ticketId: string
}

export function ServiceTicketDetail({ ticketId }: ServiceTicketDetailProps) {
  const [ticket, setTicket] = useState<ServiceTicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState("")
  const [completeLoading, setCompleteLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    fetchTicketDetail()
    fetchUserRole()
  }, [ticketId])

  const fetchTicketDetail = async () => {
    try {
      const response = await fetch(`/api/service-tickets/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      }
    } catch (error) {
      console.error("Error fetching ticket detail:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUserRole(userData.role)
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    }
  }

  const handlePrint = () => {
    // Abrir página de impresión en nueva ventana
    window.open(`/volantes/${ticketId}/imprimir`, "_blank")
  }

  const handleSendEmail = async () => {
    setEmailLoading(true)
    setEmailMessage("")

    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailMessage("Email enviado correctamente")
      } else {
        setEmailMessage(result.error || "Error al enviar email")
      }
    } catch (error) {
      setEmailMessage("Error de conexión")
    } finally {
      setEmailLoading(false)
    }
  }

  const handleCompleteTicket = async () => {
    if (
      !confirm("¿Estás seguro de que quieres marcar este volante como completado? Esta acción no se puede deshacer.")
    ) {
      return
    }

    setCompleteLoading(true)
    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setEmailMessage("Volante marcado como completado exitosamente")
        // Recargar los datos del volante
        await fetchTicketDetail()
      } else {
        setEmailMessage(result.error || "Error al completar el volante")
      }
    } catch (error) {
      setEmailMessage("Error de conexión")
    } finally {
      setCompleteLoading(false)
    }
  }

  const canCompleteTicket = () => {
    return (
      ["admin", "super_admin"].includes(userRole) &&
      ticket &&
      (ticket.status === "pendiente" || ticket.status === "escalado")
    )
  }

  if (loading) {
    return <div className="text-center py-8">Cargando volante...</div>
  }

  if (!ticket) {
    return <div className="text-center py-8">Volante no encontrado</div>
  }

  const getStatusBadge = (status: string, requiresReturn: boolean) => {
    if (status === "pendiente") {
      return <Badge variant="destructive">Pendiente</Badge>
    }
    if (requiresReturn) {
      return <Badge variant="secondary">Seguimiento</Badge>
    }
    return <Badge variant="default">Completado</Badge>
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      mantenimiento: "Mantenimiento",
      reparacion: "Reparación",
      instalacion: "Instalación",
      cambio_repuesto: "Cambio de Repuesto",
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volante #{ticket.ticket_number}</h1>
            <p className="text-gray-600">Detalles del servicio técnico</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCompleteTicket() && (
            <Button
              variant="default"
              onClick={handleCompleteTicket}
              disabled={completeLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {completeLoading ? "Completando..." : "Marcar Completado"}
            </Button>
          )}
          <Button variant="outline" onClick={handleSendEmail} disabled={emailLoading}>
            <Mail className="w-4 h-4 mr-2" />
            {emailLoading ? "Enviando..." : "Enviar Email"}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {emailMessage && (
        <Alert>
          <AlertDescription>{emailMessage}</AlertDescription>
        </Alert>
      )}

      {canCompleteTicket() && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Como administrador, puedes marcar este volante como completado una vez que se haya resuelto el seguimiento o
            items pendientes.
          </AlertDescription>
        </Alert>
      )}

      {/* Información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles del servicio */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Tipo de Servicio</span>
                <span className="font-medium">{getServiceTypeLabel(ticket.service_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Estado</span>
                {getStatusBadge(ticket.status, ticket.requires_return)}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Descripción del Problema</h4>
                <p className="text-gray-700">{ticket.description}</p>
              </div>
              {ticket.work_performed && (
                <div>
                  <h4 className="font-medium mb-2">Trabajo Realizado</h4>
                  <p className="text-gray-700">{ticket.work_performed}</p>
                </div>
              )}
              {ticket.pending_items && (
                <div>
                  <h4 className="font-medium mb-2">Items Pendientes</h4>
                  <p className="text-red-600">{ticket.pending_items}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Imagen de Referencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={ticket.image_url || "/placeholder.svg"}
                    alt="Imagen del volante de servicio"
                    className="max-w-full max-h-96 object-contain rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Repuestos utilizados */}
          {ticket.parts_used && ticket.parts_used.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Repuestos Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.parts_used.map((part: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{part.name}</p>
                        {part.notes && <p className="text-sm text-gray-500">{part.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Cantidad: {part.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Información lateral */}
        <div className="space-y-6">
          {/* Localidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{ticket.location.name}</p>
              <p className="text-sm text-gray-600">{ticket.location.address}</p>
              <Separator />
              <p className="text-sm">
                <span className="font-medium">Contacto:</span> {ticket.location.contact_person}
              </p>
              <p className="text-sm">
                <span className="font-medium">Teléfono:</span> {ticket.location.contact_phone}
              </p>
            </CardContent>
          </Card>

          {/* Técnico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{ticket.technician.name}</p>
              <p className="text-sm text-gray-600">{ticket.technician.email}</p>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Creado</p>
                <p className="text-sm text-gray-600">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Completado</p>
                <p className="text-sm text-gray-600">{new Date(ticket.completed_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Firmas */}
      <Card>
        <CardHeader>
          <CardTitle>Firmas Digitales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Firma del Técnico</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={ticket.technician_signature || "/placeholder.svg"}
                  alt="Firma del técnico"
                  className="max-w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Firmado el {new Date(ticket.technician_signed_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Firma del Cliente</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={ticket.client_signature || "/placeholder.svg"}
                  alt="Firma del cliente"
                  className="max-w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Firmado el {new Date(ticket.client_signed_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
