"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Monitor, Smartphone, Tablet, LogOut, Shield, Clock, MapPin, AlertTriangle, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface SessionInfo {
  id: string
  deviceName?: string
  deviceFingerprint?: string
  ipAddress?: string
  lastActivity: string
  isCurrentSession: boolean
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/auth/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      } else {
        throw new Error("Error al cargar sesiones")
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones activas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}/revoke`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Sesión cerrada exitosamente",
        })
        fetchSessions() // Recargar lista
      } else {
        throw new Error("Error al cerrar sesión")
      }
    } catch (error) {
      console.error("Error revoking session:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    } finally {
      setRevoking(null)
    }
  }

  const logoutAllDevices = async () => {
    setLogoutAllLoading(true)
    try {
      const response = await fetch("/api/auth/logout-all", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Éxito",
          description: data.message,
        })
        fetchSessions() // Recargar lista
      } else {
        throw new Error("Error al cerrar todas las sesiones")
      }
    } catch (error) {
      console.error("Error logging out all devices:", error)
      toast({
        title: "Error",
        description: "No se pudieron cerrar todas las sesiones",
        variant: "destructive",
      })
    } finally {
      setLogoutAllLoading(false)
    }
  }

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Monitor className="h-4 w-4" />

    const name = deviceName.toLowerCase()
    if (name.includes("iphone") || name.includes("android") || name.includes("móvil")) {
      return <Smartphone className="h-4 w-4" />
    }
    if (name.includes("ipad") || name.includes("tablet")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sesiones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sesiones Activas
            </CardTitle>
            <CardDescription>Gestiona tus sesiones activas en diferentes dispositivos</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {sessions.length > 1 && (
              <Button variant="destructive" size="sm" onClick={logoutAllDevices} disabled={logoutAllLoading}>
                <LogOut className="h-4 w-4 mr-2" />
                {logoutAllLoading ? "Cerrando..." : "Cerrar Todas"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay sesiones activas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  session.isCurrentSession ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(session.deviceName)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.deviceName || "Dispositivo Desconocido"}</span>
                        {session.isCurrentSession && (
                          <Badge variant="secondary" className="text-xs">
                            Sesión Actual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {session.ipAddress && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.ipAddress}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.lastActivity), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!session.isCurrentSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {revoking === session.id ? "Cerrando..." : "Cerrar Sesión"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información de Seguridad:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Las sesiones se cierran automáticamente después de 8 horas de inactividad</li>
                  <li>• Puedes tener máximo 5 sesiones activas simultáneamente</li>
                  <li>• Si detectas actividad sospechosa, cierra todas las sesiones inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
