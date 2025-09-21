"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import { useAutoLogout } from "@/hooks/use-auto-logout"

interface User {
  id: string
  email: string
  name: string
  role: "tecnico" | "admin" | "super_admin"
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  useAutoLogout({
    checkInterval: 5, // verificar cada 5 minutos
    onLogout: () => {
      // Limpiar estado local al hacer logout
      setUser(null)
      setUnreadChatCount(0)
      setChatOpen(false)
    },
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            "x-user-id": "admin-user-id", // Temporary hardcoded user ID for testing
          },
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          console.error("Failed to fetch user:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUnreadChatCount()
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchUnreadChatCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchUnreadChatCount = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/chat", {
        headers: {
          "x-user-role": user.role,
          "x-user-id": user.id,
        },
      })

      if (response.ok) {
        const conversations = await response.json()
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + conv.unread_count, 0)
        setUnreadChatCount(totalUnread)
      }
    } catch (error) {
      console.error("Error fetching unread chat count:", error)
    }
  }

  const handleChatToggle = () => {
    setChatOpen(!chatOpen)
    if (!chatOpen) {
      // Cuando se abre el chat, actualizar el contador después de un momento
      setTimeout(fetchUnreadChatCount, 1000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div>Error al cargar usuario</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={user.role} />
      <div className="md:ml-64">
        <main className="p-6">{children}</main>
      </div>

      <Button
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 shadow-lg relative"
        onClick={handleChatToggle}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadChatCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadChatCount > 9 ? "9+" : unreadChatCount}
          </Badge>
        )}
      </Button>

      <ChatWindow
        userRole={user.role}
        userId={user.id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onMessageRead={fetchUnreadChatCount}
      />
    </div>
  )
}
