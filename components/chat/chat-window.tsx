"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageCircle, X, Plus, ArrowLeft, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChatMessage {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  ticket_id?: string
  created_at: string
  read_at?: string
  sender_name: string
  sender_role: string
}

interface ChatConversation {
  conversation_id: string
  other_user_id: string
  other_user_name: string
  other_user_role: string
  last_message: string
  last_message_at: string
  last_sender_id: string
  unread_count: number
}

interface Technician {
  id: string
  name: string
  email: string
  role: string
  last_chat_at?: string
}

interface Ticket {
  id: string
  numero: number
  descripcion: string
  status: string
}

interface ChatWindowProps {
  userRole: "tecnico" | "admin" | "super_admin"
  userId: string
  isOpen: boolean
  onClose: () => void
  ticketId?: string
  onMessageRead?: () => void
}

export function ChatWindow({ userRole, userId, isOpen, onClose, ticketId, onMessageRead }: ChatWindowProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTechnicians, setShowTechnicians] = useState(false)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<string | undefined>(ticketId)
  const [showTicketSelector, setShowTicketSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
      if (["admin", "super_admin"].includes(userRole)) {
        fetchTechnicians()
        fetchTickets()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isOpen) return

    // Actualizar conversaciones cada 30 segundos
    const conversationInterval = setInterval(() => {
      fetchConversations()
    }, 30000)

    // Actualizar mensajes de la conversación activa cada 15 segundos
    const messageInterval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation)
      }
    }, 15000)

    return () => {
      clearInterval(conversationInterval)
      clearInterval(messageInterval)
    }
  }, [isOpen, selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat", {
        headers: {
          "x-user-role": userRole,
          "x-user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch("/api/chat/technicians", {
        headers: {
          "x-user-role": userRole,
          "x-user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTechnicians(data)
      } else {
        console.error("Error response fetching technicians:", await response.text())
      }
    } catch (error) {
      console.error("Error fetching technicians:", error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chat/${conversationId}`, {
        headers: {
          "x-user-role": userRole,
          "x-user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        if (onMessageRead) {
          onMessageRead()
        }
        // Marcar notificaciones de chat como leídas
        await markChatNotificationsAsRead(conversationId)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets", {
        headers: {
          "x-user-role": userRole,
          "x-user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.slice(0, 20)) // Limitar a 20 tickets más recientes
      } else {
        console.error("Error response fetching tickets:", await response.text())
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const startNewChat = (technicianId: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(technicianId)) {
      console.error("ID de técnico inválido:", technicianId)
      alert("Error: ID de técnico inválido")
      return
    }

    const conversationId = userId < technicianId ? `${userId}-${technicianId}` : `${technicianId}-${userId}`
    setSelectedConversation(conversationId)
    setShowTechnicians(false)
    if (!selectedTicket && ["admin", "super_admin"].includes(userRole)) {
      setShowTicketSelector(true)
    }
    setMessages([])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    // Los UUIDs tienen formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres)
    // La conversación tiene formato: uuid1-uuid2, pero necesitamos extraer los UUIDs completos
    const uuid1 = selectedConversation.substring(0, 36)
    const uuid2 = selectedConversation.substring(37) // 36 + 1 para saltar el guión separador
    const recipientId = uuid1 === userId ? uuid2 : uuid1

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(recipientId)) {
      console.error("ID de destinatario inválido:", recipientId)
      console.error("Conversación completa:", selectedConversation)
      console.error("UUID1:", uuid1, "UUID2:", uuid2)
      alert("Error: ID de destinatario inválido. Por favor, reinicia la conversación.")
      return
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
          "x-user-id": userId,
        },
        body: JSON.stringify({
          recipientId,
          message: newMessage,
          ticketId: selectedTicket === "none" ? undefined : selectedTicket,
        }),
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            id: newMsg.id,
            sender_id: userId,
            recipient_id: recipientId,
            message: newMessage,
            ticket_id: selectedTicket === "none" ? undefined : selectedTicket,
            created_at: newMsg.createdAt,
            read_at: undefined,
            sender_name: "Tú",
            sender_role: userRole,
          },
        ])
        setNewMessage("")
        fetchConversations()
      } else {
        const errorText = await response.text()
        console.error("Error sending message:", errorText)
        alert("Error al enviar mensaje: " + errorText)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Error de conexión al enviar mensaje")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })
    }
  }

  const markChatNotificationsAsRead = async (conversationId: string) => {
    try {
      const uuid1 = conversationId.substring(0, 36)
      const uuid2 = conversationId.substring(37)
      const otherUserId = uuid1 === userId ? uuid2 : uuid1

      await fetch("/api/notifications/mark-chat-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
          "x-user-id": userId,
        },
        body: JSON.stringify({
          otherUserId,
        }),
      })
    } catch (error) {
      console.error("Error marking chat notifications as read:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 z-50">
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
            {selectedTicket && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                #{tickets.find((t) => t.id === selectedTicket)?.numero || selectedTicket.slice(0, 8)}
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex p-0">
          {showTicketSelector ? (
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Button variant="ghost" size="sm" onClick={() => setShowTicketSelector(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-sm font-medium">Seleccionar Volante</h3>
              </div>
              <div className="space-y-3">
                <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar volante (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin volante específico</SelectItem>
                    {tickets.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>
                            #{ticket.numero} - {ticket.descripcion.slice(0, 30)}...
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (selectedTicket === "none") setSelectedTicket(undefined)
                    setShowTicketSelector(false)
                  }}
                  className="w-full"
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : showTechnicians ? (
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Button variant="ghost" size="sm" onClick={() => setShowTechnicians(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-sm font-medium">Iniciar Chat</h3>
              </div>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {technicians.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay técnicos disponibles</p>
                  ) : (
                    technicians.map((technician) => (
                      <div
                        key={technician.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => startNewChat(technician.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{technician.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{technician.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{technician.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : !selectedConversation ? (
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Conversaciones</h3>
                {["admin", "super_admin"].includes(userRole) && (
                  <Button variant="ghost" size="sm" onClick={() => setShowTechnicians(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-2">No hay conversaciones</p>
                      {["admin", "super_admin"].includes(userRole) && (
                        <Button variant="outline" size="sm" onClick={() => setShowTechnicians(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Iniciar chat
                        </Button>
                      )}
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.conversation_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedConversation(conversation.conversation_id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {conversation.other_user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{conversation.other_user_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conversation.last_message_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conversation.last_message}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {conversations
                      .find((c) => c.conversation_id === selectedConversation)
                      ?.other_user_name.charAt(0)
                      .toUpperCase() || "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {conversations.find((c) => c.conversation_id === selectedConversation)?.other_user_name ||
                      technicians.find((t) => selectedConversation?.includes(t.id))?.name ||
                      "Técnico"}
                  </span>
                  {selectedTicket && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Volante #{tickets.find((t) => t.id === selectedTicket)?.numero}
                    </div>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {selectedTicket && selectedTicket !== "none"
                          ? `Inicia la conversación sobre el volante #${
                              tickets.find((t) => t.id === selectedTicket)?.numero || "N/A"
                            }`
                          : "Inicia la conversación"}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex", message.sender_id === userId ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.sender_id === userId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
                          )}
                        >
                          <p>{message.message}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.sender_id === userId ? "text-blue-100" : "text-gray-500",
                            )}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      selectedTicket && selectedTicket !== "none"
                        ? `Mensaje sobre volante #${tickets.find((t) => t.id === selectedTicket)?.numero || "N/A"}...`
                        : "Escribe un mensaje..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
