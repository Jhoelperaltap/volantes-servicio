"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Printer, Mail, CheckCircle } from "lucide-react"

interface ServiceTicket {
  id: string
  ticket_number: number
  service_type: string
  description: string
  status: string
  requires_return: boolean
  completed_at: string
  location_name: string
  location_address: string
  technician_name: string
}

export function ServiceTicketsTable() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    fetchTickets()
    fetchUserRole()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/service-tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
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

  const handlePrint = (ticketId: string) => {
    window.open(`/volantes/${ticketId}/imprimir`, "_blank")
  }

  const handleSendEmail = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        alert("Email enviado correctamente")
      } else {
        alert("Error al enviar email")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const handleCompleteTicket = async (ticketId: string, ticketNumber: number) => {
    if (!confirm(`¿Estás seguro de que quieres marcar el volante #${ticketNumber} como completado?`)) {
      return
    }

    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        alert("Volante marcado como completado exitosamente")
        fetchTickets()
      } else {
        const result = await response.json()
        alert(result.error || "Error al completar el volante")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const getStatusBadge = (status: string, requiresReturn: boolean) => {
    if (status === "pendiente") {
      return <Badge variant="destructive">Pendiente</Badge>
    }
    if (status === "escalado") {
      return <Badge variant="destructive">Escalado</Badge>
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
      cambio_repuesto: "Cambio Repuesto",
    }
    return labels[type as keyof typeof labels] || type
  }

  if (loading) {
    return <div className="text-center py-4">Cargando volantes...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Localidad</TableHead>
            <TableHead>Tipo Servicio</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[180px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">#{ticket.ticket_number}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{ticket.location_name}</div>
                  <div className="text-sm text-gray-500">{ticket.location_address}</div>
                </div>
              </TableCell>
              <TableCell>{getServiceTypeLabel(ticket.service_type)}</TableCell>
              <TableCell>{ticket.technician_name}</TableCell>
              <TableCell>{getStatusBadge(ticket.status, ticket.requires_return)}</TableCell>
              <TableCell>{new Date(ticket.completed_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link href={`/volantes/${ticket.id}`}>
                    <Button variant="ghost" size="icon" title="Ver detalles">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handlePrint(ticket.id)} title="Imprimir">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSendEmail(ticket.id)} title="Enviar email">
                    <Mail className="h-4 w-4" />
                  </Button>
                  {["admin", "super_admin"].includes(userRole) &&
                    (ticket.status === "pendiente" || ticket.status === "escalado") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCompleteTicket(ticket.id, ticket.ticket_number)}
                        title="Marcar como completado"
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
