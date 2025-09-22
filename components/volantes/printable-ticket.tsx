"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, User, Package, PenTool } from "lucide-react"

interface PrintableTicketProps {
  ticketId: string
}

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
  image_url?: string // agregando campo image_url para imagen adjunta
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
  company: {
    name: string
    address: string
    phone: string
    email: string
    logo_url?: string
  }
}

export function PrintableTicket({ ticketId }: PrintableTicketProps) {
  const [ticket, setTicket] = useState<ServiceTicketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTicketForPrint()
  }, [ticketId])

  const fetchTicketForPrint = async () => {
    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/print`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      }
    } catch (error) {
      console.error("Error fetching ticket for print:", error)
    } finally {
      setLoading(false)
    }
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

  const getStatusBadge = (status: string, requiresReturn: boolean) => {
    if (status === "pendiente") {
      return <Badge variant="destructive">Pendiente</Badge>
    }
    if (requiresReturn) {
      return <Badge variant="secondary">Seguimiento</Badge>
    }
    return <Badge variant="default">Completado</Badge>
  }

  if (loading) {
    return <div className="text-center py-8">Cargando volante...</div>
  }

  if (!ticket) {
    return <div className="text-center py-8">Volante no encontrado</div>
  }

  return (
    <div className="max-w-4xl mx-auto bg-white print:shadow-none print:max-w-none print:text-xs">
      {/* Header con logo de empresa */}
      <div className="border-b-2 border-blue-600 pb-3 mb-3 print:pb-2 print:mb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 print:gap-2">
            {ticket.company.logo_url ? (
              <img
                src={ticket.company.logo_url || "/placeholder.svg"}
                alt="Logo"
                className="w-16 h-16 object-contain print:w-12 print:h-12"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center print:w-12 print:h-12">
                <Building2 className="w-8 h-8 text-white print:w-6 print:h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 print:text-lg">{ticket.company.name}</h1>
              <p className="text-gray-600 print:text-xs">{ticket.company.address}</p>
              <div className="flex gap-4 text-sm text-gray-600 print:text-xs print:gap-2">
                <span>Tel: {ticket.company.phone}</span>
                <span>Email: {ticket.company.email}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-600 print:text-lg">VOLANTE DE SERVICIO</h2>
            <p className="text-lg font-semibold print:text-base">#{ticket.ticket_number}</p>
            <p className="text-sm text-gray-600 print:text-xs">
              Fecha: {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Información del servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3 print:gap-2 print:mb-2">
        {/* Localidad */}
        <Card className="print:shadow-none print:border">
          <CardContent className="p-3 print:p-2">
            <h3 className="font-semibold mb-2 flex items-center gap-2 print:text-xs print:mb-1">
              <MapPin className="w-4 h-4 text-blue-600 print:w-3 print:h-3" />
              Información de la Localidad
            </h3>
            <div className="space-y-1 text-sm print:text-xs print:space-y-0">
              <p>
                <span className="font-medium">Nombre:</span> {ticket.location.name}
              </p>
              <p>
                <span className="font-medium">Dirección:</span> {ticket.location.address}
              </p>
              <p>
                <span className="font-medium">Contacto:</span> {ticket.location.contact_person}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span> {ticket.location.contact_phone}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Técnico */}
        <Card className="print:shadow-none print:border">
          <CardContent className="p-3 print:p-2">
            <h3 className="font-semibold mb-2 flex items-center gap-2 print:text-xs print:mb-1">
              <User className="w-4 h-4 text-blue-600 print:w-3 print:h-3" />
              Técnico Asignado
            </h3>
            <div className="space-y-1 text-sm print:text-xs print:space-y-0">
              <p>
                <span className="font-medium">Nombre:</span> {ticket.technician.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {ticket.technician.email}
              </p>
              <p>
                <span className="font-medium">Tipo de Servicio:</span> {getServiceTypeLabel(ticket.service_type)}
              </p>
              <p>
                <span className="font-medium">Estado:</span> {getStatusBadge(ticket.status, ticket.requires_return)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descripción del trabajo */}
      <Card className="mb-3 print:mb-2 print:shadow-none print:border">
        <CardContent className="p-3 print:p-2">
          <h3 className="font-semibold mb-2 print:text-xs print:mb-1">Descripción del Problema/Solicitud</h3>
          <p className="text-sm text-gray-700 mb-2 print:text-xs print:mb-1">{ticket.description}</p>

          {ticket.work_performed && (
            <>
              <h3 className="font-semibold mb-2 print:text-xs print:mb-1">Trabajo Realizado</h3>
              <p className="text-sm text-gray-700 print:text-xs">{ticket.work_performed}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Repuestos utilizados */}
      {ticket.parts_used && ticket.parts_used.length > 0 && (
        <Card className="mb-3 print:mb-2 print:shadow-none print:border">
          <CardContent className="p-3 print:p-2">
            <h3 className="font-semibold mb-2 flex items-center gap-2 print:text-xs print:mb-1">
              <Package className="w-4 h-4 text-blue-600 print:w-3 print:h-3" />
              Repuestos Utilizados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm print:text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 print:py-0">Repuesto</th>
                    <th className="text-center py-1 print:py-0">Cantidad</th>
                    <th className="text-left py-1 print:py-0">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.parts_used.map((part: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-1 print:py-0">{part.name}</td>
                      <td className="text-center py-1 print:py-0">{part.quantity}</td>
                      <td className="py-1 print:py-0">{part.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imagen de Referencia */}
      {ticket.image_url && (
        <Card className="mb-3 print:mb-2 print:shadow-none print:border">
          <CardContent className="p-3 print:p-2">
            <h3 className="font-semibold mb-2 print:text-xs print:mb-1">Imagen de Referencia</h3>
            <div className="flex justify-center">
              <img
                src={
                  ticket.image_url.startsWith("http")
                    ? ticket.image_url
                    : `${window.location.origin}${ticket.image_url}`
                }
                alt="Imagen del volante de servicio"
                className="max-w-full max-h-32 object-contain rounded border print:max-h-24 print:!-webkit-print-color-adjust-exact print:!color-adjust-exact"
                onError={(e) => {
                  console.error("Error loading image:", ticket.image_url)
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items pendientes */}
      {ticket.pending_items && (
        <Card className="mb-3 print:mb-2 print:shadow-none print:border">
          <CardContent className="p-3 print:p-2">
            <h3 className="font-semibold mb-2 text-red-600 print:text-xs print:mb-1">Items Pendientes</h3>
            <p className="text-sm text-red-700 print:text-xs">{ticket.pending_items}</p>
          </CardContent>
        </Card>
      )}

      {/* Firmas */}
      <Card className="mb-3 print:mb-2 print:shadow-none print:border print:page-break-inside-avoid">
        <CardContent className="p-3 print:p-2">
          <h3 className="font-semibold mb-2 flex items-center gap-2 print:text-xs print:mb-1">
            <PenTool className="w-4 h-4 text-blue-600 print:w-3 print:h-3" />
            Firmas Digitales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div>
              <h4 className="font-medium mb-1 print:text-xs">Firma del Técnico</h4>
              <div className="border rounded-lg p-2 bg-gray-50 h-20 flex items-center justify-center print:h-16 print:p-1">
                {ticket.technician_signature ? (
                  <img
                    src={ticket.technician_signature || "/placeholder.svg"}
                    alt="Firma del técnico"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Sin firma</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 print:text-[10px]">
                Firmado el {new Date(ticket.technician_signed_at).toLocaleString()}
              </p>
              <div className="mt-1 pt-1 border-t border-gray-300">
                <p className="text-xs text-center print:text-[10px]">{ticket.technician.name}</p>
                <p className="text-xs text-center text-gray-500 print:text-[10px]">Técnico</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-1 print:text-xs">Firma del Cliente</h4>
              <div className="border rounded-lg p-2 bg-gray-50 h-20 flex items-center justify-center print:h-16 print:p-1">
                {ticket.client_signature ? (
                  <img
                    src={ticket.client_signature || "/placeholder.svg"}
                    alt="Firma del cliente"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Sin firma</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 print:text-[10px]">
                Firmado el {new Date(ticket.client_signed_at).toLocaleString()}
              </p>
              <div className="mt-1 pt-1 border-t border-gray-300">
                <p className="text-xs text-center print:text-[10px]">{ticket.location.contact_person}</p>
                <p className="text-xs text-center text-gray-500 print:text-[10px]">Cliente</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-2 print:text-[10px] print:pt-1">
        <p>Este documento fue generado automáticamente el {new Date().toLocaleString()}</p>
        <p>
          Volante de Servicio #{ticket.ticket_number} - {ticket.company.name}
        </p>
      </div>
    </div>
  )
}
