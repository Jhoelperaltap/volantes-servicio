"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Clock, CheckCircle, Eye, X } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  ticket_id: string
  ticket_number: number
  type: "pending_reminder" | "escalation" | "overdue"
  message: string
  is_read: boolean
  created_at: string
  location_name: string
  technician_name: string
  days_pending: number
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      })
      if (response.ok) {
        setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId))
      }
    } catch (error) {
      console.error("Error dismissing notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "escalation":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "overdue":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "escalation":
        return <Badge variant="destructive">Escalado</Badge>
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="secondary">Recordatorio</Badge>
    }
  }

  const getPriorityColor = (type: string, daysPending: number) => {
    if (type === "overdue" || daysPending >= 7) return "border-l-red-500"
    if (type === "escalation" || daysPending >= 3) return "border-l-yellow-500"
    return "border-l-blue-500"
  }

  if (loading) {
    return <div className="text-center py-8">Cargando notificaciones...</div>
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
        <p>No hay notificaciones pendientes</p>
      </div>
    )
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  return (
    <div className="space-y-6">
      {/* Notificaciones no leídas */}
      {unreadNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Requieren Atención ({unreadNotifications.length})
          </h3>
          <div className="space-y-3">
            {unreadNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-l-4 ${getPriorityColor(notification.type, notification.days_pending)} ${
                  !notification.is_read ? "bg-blue-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Volante #{notification.ticket_number}</span>
                          {getNotificationBadge(notification.type)}
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {notification.days_pending} días
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{notification.message}</p>
                        <div className="text-xs text-gray-500">
                          <p>Localidad: {notification.location_name}</p>
                          <p>Técnico: {notification.technician_name}</p>
                          <p>Creado: {new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/volantes/${notification.ticket_id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={notification.is_read}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Separador */}
      {unreadNotifications.length > 0 && readNotifications.length > 0 && <Separator />}

      {/* Notificaciones leídas */}
      {readNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-600">Leídas ({readNotifications.length})</h3>
          <div className="space-y-3">
            {readNotifications.slice(0, 5).map((notification) => (
              <Card key={notification.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Volante #{notification.ticket_number}</span>
                          {getNotificationBadge(notification.type)}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {notification.location_name} - {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/volantes/${notification.ticket_id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
