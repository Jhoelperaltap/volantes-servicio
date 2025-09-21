"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

interface RecentTicket {
  id: string
  ticket_number: number
  location_name: string
  technician_name: string
  service_type: string
  status: string
  created_at: string
}

export function RecentTickets() {
  const [tickets, setTickets] = useState<RecentTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentTickets()
  }, [])

  const fetchRecentTickets = async () => {
    try {
      const response = await fetch("/api/admin/recent-tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Error fetching recent tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completado: "default",
      pendiente: "destructive",
      escalado: "secondary",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
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
    return <div className="text-center py-4">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">#{ticket.ticket_number}</span>
              {getStatusBadge(ticket.status)}
            </div>
            <p className="text-sm font-medium text-gray-900">{ticket.location_name}</p>
            <p className="text-sm text-gray-600">
              {getServiceTypeLabel(ticket.service_type)} - {ticket.technician_name}
            </p>
            <p className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString()}</p>
          </div>
          <Link href={`/volantes/${ticket.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  )
}
