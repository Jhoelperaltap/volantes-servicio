"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface NotificationSummary {
  id: string
  ticket_number: number
  type: string
  message: string
  created_at: string
  is_read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    if (loading) return // Prevent multiple simultaneous requests

    setLoading(true)
    try {
      const response = await fetch("/api/notifications?limit=5")
      if (response.ok) {
        const data = await response.json()
        const unread = data.filter((n: NotificationSummary) => !n.is_read)
        setNotifications(data.slice(0, 5))
        setUnreadCount(unread.length)
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
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>{loading ? "Cargando..." : "No hay notificaciones"}</DropdownMenuItem>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex-col items-start p-3 cursor-pointer ${!notification.is_read ? "bg-blue-50" : ""}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">Volante #{notification.ticket_number}</span>
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                  {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/notificaciones" className="w-full text-center">
                Ver todas las notificaciones
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
