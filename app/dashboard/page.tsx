"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, MapPin, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  ticketsToday: number
  activeTechnicians: number
  totalLocations: number
  pendingTickets: number
}

interface RecentTicket {
  id: string
  ticket_number: number
  location_name: string
  location_id: string
  service_type: string
  status: string
  created_at: string
  technician_name: string
}

interface Notification {
  id: string
  message: string
  type: string
  created_at: string
  ticket_number: number
}

interface LocationSummary {
  id: string
  name: string
  ticket_count: number
  pending_count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    ticketsToday: 0,
    activeTechnicians: 0,
    totalLocations: 0,
    pendingTickets: 0,
  })
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [topLocations, setTopLocations] = useState<LocationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [userRole, setUserRole] = useState<"tecnico" | "admin" | "super_admin" | null>(null)

  useEffect(() => {
    fetchUserRole()
    fetchDashboardData()
  }, [])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "x-user-id": "admin-user-id", // Temporary hardcoded user ID for testing
        },
      })
      if (response.ok) {
        const userData = await response.json()
        setUserRole(userData.role)
      }
    } catch (error) {}
  }

  const fetchDashboardData = async () => {
    try {
      setError(null)

      const headers = {
        "x-user-role": userRole || "tecnico",
        "x-user-id": "admin-user-id", // Temporary hardcoded user ID for testing
      }

      const [statsResponse, ticketsResponse, notificationsResponse, locationsResponse] = await Promise.allSettled([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/recent-tickets", { headers }),
        fetch("/api/notifications?limit=5", { headers }),
        fetch("/api/admin/locations-summary", { headers }),
      ])

      if (statsResponse.status === "fulfilled" && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json()
        setStats(statsData)
      } else if (statsResponse.status === "rejected" || !statsResponse.value.ok) {
        // Silently handle stats error - use default values
      }

      if (ticketsResponse.status === "fulfilled" && ticketsResponse.value.ok) {
        const ticketsData = await ticketsResponse.value.json()
        setRecentTickets(ticketsData)
      } else if (ticketsResponse.status === "rejected" || !ticketsResponse.value.ok) {
        // Silently handle tickets error - use empty array
      }

      if (notificationsResponse.status === "fulfilled" && notificationsResponse.value.ok) {
        const notificationsData = await notificationsResponse.value.json()
        setNotifications(notificationsData)
      }

      if (locationsResponse.status === "fulfilled" && locationsResponse.value.ok) {
        const locationsData = await locationsResponse.value.json()
        setTopLocations(locationsData)
      } else if (locationsResponse.status === "rejected" || !locationsResponse.value.ok) {
        // Silently handle locations error - use empty array
      }
    } catch (error) {
      setError("Error al cargar los datos del dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado":
        return "bg-green-500"
      case "pendiente":
        return "bg-yellow-500"
      case "escalado":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getServiceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      mantenimiento: "Mantenimiento",
      reparacion: "Reparación",
      instalacion: "Instalación",
      cambio_repuesto: "Cambio repuesto",
    }
    return labels[type] || type
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Hace menos de 1h"
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              {userRole === "tecnico"
                ? "Resumen de tus actividades y volantes asignados"
                : "Resumen general del sistema de volantes de servicio"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === "tecnico" ? "Mis Volantes Hoy" : "Volantes Hoy"}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.ticketsToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.ticketsToday === 0 ? "Ninguno creado hoy" : "Creados hoy"}
              </p>
              <div className="mt-2">
                <Link href="/volantes/crear">
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    Crear nuevo volante
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {userRole !== "tecnico" && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Técnicos Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTechnicians}</div>
                <p className="text-xs text-muted-foreground">Registrados</p>
                <div className="mt-2">
                  <Link href="/admin/usuarios">
                    <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                      Ver técnicos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Localidades</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">Registradas</p>
              <div className="mt-2">
                <Link href="/admin/localidades">
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto flex items-center gap-1">
                    Ver localidades
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === "tecnico" ? "Mis Pendientes" : "Pendientes"}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTickets}</div>
              <p className={`text-xs ${stats.pendingTickets > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {stats.pendingTickets > 0 ? "Requieren atención" : "Todo al día"}
              </p>
              {stats.pendingTickets > 0 && (
                <div className="mt-2">
                  <Link href={userRole === "tecnico" ? "/volantes" : "/admin/notificaciones"}>
                    <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-red-600">
                      Ver pendientes
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{userRole === "tecnico" ? "Mis Volantes Recientes" : "Actividad Reciente"}</CardTitle>
              <CardDescription>
                {userRole === "tecnico" ? "Tus últimos volantes" : "Últimos volantes creados"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay volantes recientes</p>
                ) : (
                  recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/volantes/${ticket.id}`}>
                            <p className="text-sm font-medium hover:text-blue-600 cursor-pointer">
                              Volante #{ticket.ticket_number}
                            </p>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Link href={`/admin/localidades`} className="hover:text-blue-600">
                            {ticket.location_name}
                          </Link>
                          <span>•</span>
                          <span>{getServiceTypeLabel(ticket.service_type)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatTimeAgo(ticket.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {userRole !== "tecnico" && (
            <Card>
              <CardHeader>
                <CardTitle>Top Localidades</CardTitle>
                <CardDescription>Localidades con más actividad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay datos de localidades</p>
                  ) : (
                    topLocations.map((location, index) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <Link href={`/admin/localidades`} className="text-sm font-medium hover:text-blue-600">
                              {location.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {location.ticket_count} volantes
                              {location.pending_count > 0 && (
                                <span className="text-red-600 ml-1">({location.pending_count} pendientes)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {userRole !== "tecnico" && (
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Recientes</CardTitle>
              <CardDescription>Alertas y recordatorios importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No hay notificaciones pendientes</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 ${
                          notification.type === "escalation"
                            ? "text-red-500"
                            : notification.type === "overdue"
                              ? "text-red-600"
                              : "text-yellow-500"
                        }`}
                      />
                      <div className="flex-1">
                        <Link href={`/volantes/${notification.ticket_number}`}>
                          <p className="text-sm font-medium hover:text-blue-600 cursor-pointer">
                            Volante #{notification.ticket_number}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</div>
                    </div>
                  ))
                )}
                {notifications.length > 0 && (
                  <div className="text-center pt-4">
                    <Link href="/admin/notificaciones">
                      <Button variant="outline" size="sm">
                        Ver todas las notificaciones
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
