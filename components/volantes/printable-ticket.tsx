"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, User, Package } from "lucide-react"

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
  equipment?: {
    type: string
    brand: string
    model: string
    serial_number: string
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
    <div className="max-w-4xl mx-auto bg-white print:shadow-none print:max-w-none print:text-xs print:leading-tight">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-2 print:grid-cols-3 print:gap-1 print:mb-1">
        {/* Localidad */}
        <div className="border rounded p-2 print:p-1 print:border-gray-400">
          <h3 className="font-semibold mb-1 flex items-center gap-1 text-sm print:text-xs print:mb-0">
            <MapPin className="w-3 h-3 text-blue-600 print:w-2 print:h-2" />
            Localidad
          </h3>
          <div className="space-y-0 text-xs print:text-[10px]">
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
        </div>

        {/* Técnico */}
        <div className="border rounded p-2 print:p-1 print:border-gray-400">
          <h3 className="font-semibold mb-1 flex items-center gap-1 text-sm print:text-xs print:mb-0">
            <User className="w-3 h-3 text-blue-600 print:w-2 print:h-2" />
            Técnico
          </h3>
          <div className="space-y-0 text-xs print:text-[10px]">
            <p>
              <span className="font-medium">Nombre:</span> {ticket.technician.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {ticket.technician.email}
            </p>
            <p>
              <span className="font-medium">Servicio:</span> {getServiceTypeLabel(ticket.service_type)}
            </p>
            <div className="flex items-center gap-1">
              <span className="font-medium">Estado:</span>
              {getStatusBadge(ticket.status, ticket.requires_return)}
            </div>
          </div>
        </div>

        {/* Información del equipo */}
        <div className="border rounded p-2 print:p-1 print:border-gray-400">
          <h3 className="font-semibold mb-1 flex items-center gap-1 text-sm print:text-xs print:mb-0">
            <Package className="w-3 h-3 text-blue-600 print:w-2 print:h-2" />
            Equipo
          </h3>
          <div className="space-y-0 text-xs print:text-[10px]">
            <p>
              <span className="font-medium">Tipo:</span> {ticket.equipment?.type || "No especificado"}
            </p>
            <p>
              <span className="font-medium">Marca:</span> {ticket.equipment?.brand || "No especificado"}
            </p>
            <p>
              <span className="font-medium">Modelo:</span> {ticket.equipment?.model || "No especificado"}
            </p>
            <p>
              <span className="font-medium">Serie:</span> {ticket.equipment?.serial_number || "No especificado"}
            </p>
          </div>
        </div>
      </div>

      {/* Descripción del trabajo */}
      <div className="border rounded p-2 mb-2 print:p-1 print:mb-1 print:border-gray-400">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 print:grid-cols-2 print:gap-2">
          <div>
            <h3 className="font-semibold mb-1 text-sm print:text-xs print:mb-0">Descripción del Problema</h3>
            <p className="text-xs text-gray-700 print:text-[10px]">{ticket.description}</p>
          </div>
          {ticket.work_performed && (
            <div>
              <h3 className="font-semibold mb-1 text-sm print:text-xs print:mb-0">Trabajo Realizado</h3>
              <p className="text-xs text-gray-700 print:text-[10px]">{ticket.work_performed}</p>
            </div>
          )}
        </div>
      </div>

      {/* Repuestos utilizados e imagen de referencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2 print:grid-cols-2 print:gap-1 print:mb-1">
        {/* Repuestos utilizados */}
        {ticket.parts_used && ticket.parts_used.length > 0 && (
          <div className="border rounded p-2 print:p-1 print:border-gray-400">
            <h3 className="font-semibold mb-1 text-sm print:text-xs print:mb-0">Repuestos Utilizados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs print:text-[10px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-0">Repuesto</th>
                    <th className="text-center py-0">Cant.</th>
                    <th className="text-left py-0">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.parts_used.map((part: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-0">{part.name}</td>
                      <td className="text-center py-0">{part.quantity}</td>
                      <td className="py-0">{part.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Imagen de Referencia */}
        {ticket.image_url && (
          <div className="border rounded p-2 print:p-1 print:border-gray-400">
            <h3 className="font-semibold mb-1 text-sm print:text-xs print:mb-0">Imagen de Referencia</h3>
            <div className="flex justify-center">
              <img
                src={
                  ticket.image_url.startsWith("http")
                    ? ticket.image_url
                    : `${window.location.origin}${ticket.image_url}`
                }
                alt="Imagen del volante de servicio"
                className="max-w-full max-h-20 object-contain rounded border print:max-h-16"
                onError={(e) => {
                  console.error("Error loading image:", ticket.image_url)
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items pendientes */}
      {ticket.pending_items && (
        <div className="border rounded p-2 mb-2 print:p-1 print:mb-1 print:border-gray-400 bg-red-50 print:bg-white">
          <h3 className="font-semibold mb-1 text-red-600 text-sm print:text-xs print:mb-0">Items Pendientes</h3>
          <p className="text-xs text-red-700 print:text-[10px]">{ticket.pending_items}</p>
        </div>
      )}

      {/* Firmas */}
      <div className="border rounded p-2 mb-2 print:p-1 print:mb-1 print:border-gray-400 print:page-break-inside-avoid">
        <h3 className="font-semibold mb-1 text-sm print:text-xs print:mb-0">Firmas Digitales</h3>
        <div className="grid grid-cols-2 gap-3 print:gap-1">
          <div>
            <h4 className="font-medium mb-1 text-xs print:text-[10px]">Firma del Técnico</h4>
            <div className="border rounded p-1 bg-gray-50 h-12 flex items-center justify-center print:h-10 print:bg-white">
              {ticket.technician_signature ? (
                <img
                  src={ticket.technician_signature || "/placeholder.svg"}
                  alt="Firma del técnico"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-[10px]">Sin firma</span>
              )}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-300">
              <p className="text-[10px] text-center">{ticket.technician.name}</p>
              <p className="text-[10px] text-center text-gray-500">Técnico</p>
              <p className="text-[8px] text-gray-500 text-center">
                {ticket.technician_signed_at ? new Date(ticket.technician_signed_at).toLocaleDateString() : "Sin fecha"}
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-1 text-xs print:text-[10px]">Firma del Cliente</h4>
            <div className="border rounded p-1 bg-gray-50 h-12 flex items-center justify-center print:h-10 print:bg-white">
              {ticket.client_signature ? (
                <img
                  src={ticket.client_signature || "/placeholder.svg"}
                  alt="Firma del cliente"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-[10px]">Sin firma</span>
              )}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-300">
              <p className="text-[10px] text-center">{ticket.location.contact_person}</p>
              <p className="text-[10px] text-center text-gray-500">Cliente</p>
              <p className="text-[8px] text-gray-500 text-center">
                {ticket.client_signed_at ? new Date(ticket.client_signed_at).toLocaleDateString() : "Sin fecha"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-500 border-t pt-1 print:text-[8px]">
        <p>
          Generado automáticamente el {new Date().toLocaleString()} - Volante #{ticket.ticket_number}
        </p>
      </div>
    </div>
  )
}
