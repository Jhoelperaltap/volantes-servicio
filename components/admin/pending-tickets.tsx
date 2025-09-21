"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Clock, CheckCircle } from "lucide-react"

interface PendingTicket {
  id: string
  ticket_number: number
  location_name: string
  technician_name: string
  pending_items: string
  days_pending: number
  requires_return: boolean
}

export function PendingTickets() {
  const [tickets, setTickets] = useState<PendingTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingTickets()
  }, [])

  const fetchPendingTickets = async () => {
    try {
      const response = await fetch("/api/admin/pending-tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Error fetching pending tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityBadge = (daysPending: number) => {
    if (daysPending >= 7) {
      return <Badge variant="destructive">Crítico</Badge>
    }
    if (daysPending >= 3) {
      return <Badge variant="secondary">Alto</Badge>
    }
    return <Badge variant="outline">Normal</Badge>
  }

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
        <p>No hay volantes pendientes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="flex items-start justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">#{ticket.ticket_number}</span>
              {getPriorityBadge(ticket.days_pending)}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                {ticket.days_pending} días
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">{ticket.location_name}</p>
            <p className="text-sm text-gray-600">Técnico: {ticket.technician_name}</p>
            {ticket.pending_items && <p className="text-sm text-gray-500 mt-1">Pendiente: {ticket.pending_items}</p>}
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
