"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  completion_note?: string // Added completion_note field
  technician_signature: string
  client_signature: string
  technician_signed_at: string
  client_signed_at: string
  completed_at: string
  created_at: string
  image_url?: string
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
  // Added states for the dialog of completing and the note
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [completionNote, setCompletionNote] = useState("")
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
    // Open print page in new window
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
        setEmailMessage("Email sent successfully")
      } else {
        setEmailMessage(result.error || "Error sending email")
      }
    } catch (error) {
      setEmailMessage("Connection error")
    } finally {
      setEmailLoading(false)
    }
  }

  // Modified function to include the completion note
  const handleCompleteTicket = async () => {
    setCompleteLoading(true)
    try {
      const response = await fetch(`/api/service-tickets/${ticketId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completion_note: completionNote.trim() || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailMessage("Ticket marked as completed successfully")
        setShowCompleteDialog(false)
        setCompletionNote("")
        // Reload ticket data
        await fetchTicketDetail()
      } else {
        setEmailMessage(result.error || "Error completing ticket")
      }
    } catch (error) {
      setEmailMessage("Connection error")
    } finally {
      setCompleteLoading(false)
    }
  }

  const canCompleteTicket = () => {
    return (
      ["admin", "super_admin"].includes(userRole) &&
      ticket &&
      (ticket.status === "pendiente" || ticket.status === "escalado" || ticket.status === "seguimiento")
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading ticket...</div>
  }

  if (!ticket) {
    return <div className="text-center py-8">Ticket not found</div>
  }

  const getStatusBadge = (status: string, requiresReturn: boolean) => {
    if (status === "pendiente") {
      return <Badge variant="destructive">Pending</Badge>
    }
    if (requiresReturn) {
      return <Badge variant="secondary">Follow-up</Badge>
    }
    return <Badge variant="default">Completed</Badge>
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      mantenimiento: "Maintenance",
      reparacion: "Repair",
      instalacion: "Installation",
      cambio_repuesto: "Part Replacement",
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
            <h1 className="text-3xl font-bold text-gray-900">Ticket #{ticket.ticket_number}</h1>
            <p className="text-gray-600">Technical service details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCompleteTicket() && (
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Complete Ticket</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to mark this ticket as completed? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="completion-note">Completion Note (optional)</Label>
                    <Textarea
                      id="completion-note"
                      placeholder="E.g: Resolved with ticket #1234, replaced defective part..."
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Indicate which ticket closed this pending or follow-up, or any relevant information.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteTicket}
                    disabled={completeLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completeLoading ? "Completing..." : "Complete Ticket"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={handleSendEmail} disabled={emailLoading}>
            <Mail className="w-4 h-4 mr-2" />
            {emailLoading ? "Sending..." : "Send Email"}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
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
            As an admin, you can mark this ticket as completed once the follow-up or pending items have been resolved.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Service Type</span>
                <span className="font-medium">{getServiceTypeLabel(ticket.service_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                {getStatusBadge(ticket.status, ticket.requires_return)}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Problem Description</h4>
                <p className="text-gray-700">{ticket.description}</p>
              </div>
              {ticket.work_performed && (
                <div>
                  <h4 className="font-medium mb-2">Work Performed</h4>
                  <p className="text-gray-700">{ticket.work_performed}</p>
                </div>
              )}
              {ticket.pending_items && (
                <div>
                  <h4 className="font-medium mb-2">Pending Items</h4>
                  <p className="text-red-600">{ticket.pending_items}</p>
                </div>
              )}
              {/* Show completion note if it exists */}
              {ticket.completion_note && (
                <div>
                  <h4 className="font-medium mb-2">Completion Note</h4>
                  <p className="text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    {ticket.completion_note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Reference */}
          {ticket.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={ticket.image_url || "/placeholder.svg"}
                    alt="Service ticket image"
                    className="max-w-full max-h-96 object-contain rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parts Used */}
          {ticket.parts_used && ticket.parts_used.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Parts Used
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
                        <p className="font-medium">Quantity: {part.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{ticket.location.name}</p>
              <p className="text-sm text-gray-600">{ticket.location.address}</p>
              <Separator />
              <p className="text-sm">
                <span className="font-medium">Contact:</span> {ticket.location.contact_person}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span> {ticket.location.contact_phone}
              </p>
            </CardContent>
          </Card>

          {/* Technician */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Technician
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{ticket.technician.name}</p>
              <p className="text-sm text-gray-600">{ticket.technician.email}</p>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-600">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-sm text-gray-600">{new Date(ticket.completed_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Digital Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Technician's Signature</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={ticket.technician_signature || "/placeholder.svg"}
                  alt="Technician's signature"
                  className="max-w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Signed on {new Date(ticket.technician_signed_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Client's Signature</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={ticket.client_signature || "/placeholder.svg"}
                  alt="Client's signature"
                  className="max-w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Signed on {new Date(ticket.client_signed_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
