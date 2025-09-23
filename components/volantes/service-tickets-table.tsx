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
import { Eye, Printer, Mail, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { AdvancedSearch } from "./advanced-search"

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
  client_name: string
  company_name: string
  equipment_name: string
  equipment_model: string
  equipment_type: string
  technician_name: string
}

interface SearchFilters {
  q: string
  status: string[]
  serviceType: string[]
  companyId: string
  clientId: string
  locationId: string
  equipmentType: string
  technicianId: string
  dateFrom: string
  dateTo: string
  ticketNumber: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function ServiceTicketsTable() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [completeLoading, setCompleteLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isSearchActive, setIsSearchActive] = useState(false)

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
        setIsSearchActive(false)
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

  const handleSearch = async (filters: SearchFilters, page = 1) => {
    setSearchLoading(true)
    try {
      const params = new URLSearchParams()

      // Agregar parámetros no vacíos
      if (filters.q) params.append("q", filters.q)
      if (filters.ticketNumber) params.append("ticketNumber", filters.ticketNumber)
      filters.status.forEach((s) => params.append("status", s))
      filters.serviceType.forEach((st) => params.append("serviceType", st))
      if (filters.companyId) params.append("companyId", filters.companyId)
      if (filters.clientId) params.append("clientId", filters.clientId)
      if (filters.locationId) params.append("locationId", filters.locationId)
      if (filters.equipmentType) params.append("equipmentType", filters.equipmentType)
      if (filters.technicianId) params.append("technicianId", filters.technicianId)
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters.dateTo) params.append("dateTo", filters.dateTo)
      params.append("page", page.toString())
      params.append("limit", "50")

      const response = await fetch(`/api/service-tickets/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
        setPagination(data.pagination)
        setIsSearchActive(true)
      }
    } catch (error) {
      console.error("Error searching tickets:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleClearSearch = () => {
    setIsSearchActive(false)
    setPagination({
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    })
    fetchTickets()
  }

  const handlePageChange = (newPage: number, filters: SearchFilters) => {
    if (isSearchActive) {
      handleSearch(filters, newPage)
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
        // Refrescar la lista
        if (isSearchActive) {
          // Si hay búsqueda activa, necesitaríamos los filtros actuales
          // Por simplicidad, volvemos a cargar todos
          handleClearSearch()
        } else {
          fetchTickets()
        }
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
      <AdvancedSearch
        onSearch={(filters) => handleSearch(filters, 1)}
        onClear={handleClearSearch}
        loading={searchLoading}
      />

      {isSearchActive && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Mostrando {tickets.length} de {pagination.total} resultados
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1, {} as SearchFilters)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1, {} as SearchFilters)}
                disabled={!pagination.hasNext}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Empresa / Cliente</TableHead>
              <TableHead>Localidad</TableHead>
              <TableHead>Equipo</TableHead>
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
                    <div className="font-medium text-sm">{ticket.company_name}</div>
                    <div className="text-xs text-gray-500">{ticket.client_name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{ticket.location_name}</div>
                    <div className="text-xs text-gray-500">{ticket.location_address}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {ticket.equipment_name ? (
                      <>
                        <div className="font-medium text-sm">{ticket.equipment_name}</div>
                        <div className="text-xs text-gray-500">
                          {ticket.equipment_type && (
                            <Badge
                              variant="outline"
                              className="text-xs mr-1 bg-purple-50 text-purple-700 border-purple-200"
                            >
                              {ticket.equipment_type}
                            </Badge>
                          )}
                          {ticket.equipment_model && `${ticket.equipment_model}`}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Sin equipo</span>
                    )}
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
