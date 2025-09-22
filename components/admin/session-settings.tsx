"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings, Save, Shield, Clock, Smartphone } from "lucide-react"

interface SessionSettings {
  maxConcurrentSessions: number
  sessionTimeoutMinutes: number
  requireDeviceApproval: boolean
}

export function SessionSettings() {
  const [settings, setSettings] = useState<SessionSettings>({
    maxConcurrentSessions: 5,
    sessionTimeoutMinutes: 480,
    requireDeviceApproval: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/auth/session-settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching session settings:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones de sesión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/auth/session-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Configuración de sesiones guardada correctamente",
        })
      } else {
        throw new Error("Error al guardar configuración")
      }
    } catch (error) {
      console.error("Error saving session settings:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de sesiones",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SessionSettings, value: number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Sesiones
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
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Sesiones
        </CardTitle>
        <CardDescription>Personaliza los límites y comportamiento de las sesiones de usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxSessions" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Máximo de Sesiones Concurrentes
            </Label>
            <Input
              id="maxSessions"
              type="number"
              min="1"
              max="10"
              value={settings.maxConcurrentSessions}
              onChange={(e) => handleInputChange("maxConcurrentSessions", Number.parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de dispositivos que pueden estar conectados simultáneamente (1-10)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo de Sesión (minutos)
            </Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="60"
              max="1440"
              step="60"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => handleInputChange("sessionTimeoutMinutes", Number.parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              Duración máxima de una sesión antes de expirar (60-1440 minutos)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label htmlFor="deviceApproval" className="font-medium">
                Requerir Aprobación de Nuevos Dispositivos
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Los nuevos dispositivos necesitarán aprobación antes de acceder
            </p>
          </div>
          <Switch
            id="deviceApproval"
            checked={settings.requireDeviceApproval}
            onCheckedChange={(checked) => handleInputChange("requireDeviceApproval", checked)}
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">Configuración Actual:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Máximo {settings.maxConcurrentSessions} dispositivos conectados</li>
            <li>• Sesiones expiran después de {Math.floor(settings.sessionTimeoutMinutes / 60)} horas</li>
            <li>• Aprobación de dispositivos: {settings.requireDeviceApproval ? "Activada" : "Desactivada"}</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
