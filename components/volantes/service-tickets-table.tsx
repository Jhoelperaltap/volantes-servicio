"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [completeLoading, setCompleteLoading] = useState(false)

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

  const openCompleteDialog = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket)
    setCompletionNote("")
    setShowCompleteDialog(true)
  }

  const handleCompleteTicket = async () => {
    if (!selectedTicket) return

    setCompleteLoading(true)
    try {
      const response = await fetch(`/api/service-tickets/${selectedTicket.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completion_note: completionNote.trim() || null,
        }),
      })

      if (response.ok) {
        alert("Volante marcado como completado exitosamente")
        setShowCompleteDialog(false)
        setSelectedTicket(null)
        setCompletionNote("")
        fetchTickets()
      } else {
        const result = await response.json()
        alert(result.error || "Error al completar el volante")
      }
    } catch (error) {
      alert("Error de conexión")
    } finally {
      setCompleteLoading(false)
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

  const canCompleteTicket = (ticket: ServiceTicket) => {
    return (
      ["admin", "super_admin"].includes(userRole) &&
      (ticket.status === "pendiente" || ticket.status === "escalado" || ticket.status === "seguimiento")
    )
  }

  if (loading) {
    return <div className="text-center py-4">Cargando volantes...</div>
  }

  return (
    <>
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
                    {canCompleteTicket(ticket) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCompleteDialog(ticket)}
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

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Completar Volante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres marcar el volante #{selectedTicket?.ticket_number} como completado? Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="completion-note">Nota de Cierre (opcional)</Label>
              <Textarea
                id="completion-note"
                placeholder="Ej: Resuelto con volante #1234, se reemplazó pieza defectuosa..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Indica qué volante cerró este pendiente o seguimiento, o cualquier información relevante.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteTicket}
              disabled={completeLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeLoading ? "Completando..." : "Completar Volante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
