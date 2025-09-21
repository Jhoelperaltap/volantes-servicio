"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Clock, AlertTriangle, Mail } from "lucide-react"

interface NotificationSettings {
  reminder_hours: number
  escalation_days: number
  overdue_days: number
  email_notifications: boolean
  auto_escalation: boolean
  reminder_frequency_hours: number
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    reminder_hours: 24,
    escalation_days: 3,
    overdue_days: 7,
    email_notifications: true,
    auto_escalation: true,
    reminder_frequency_hours: 12,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/notification-settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/notification-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage("Configuración guardada exitosamente")
      } else {
        setMessage("Error al guardar la configuración")
      }
    } catch (error) {
      setMessage("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando configuración...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tiempos de escalamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tiempos de Escalamiento
          </CardTitle>
          <CardDescription>Configure los tiempos para recordatorios y escalamientos automáticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_hours">Primer Recordatorio (horas)</Label>
              <Input
                id="reminder_hours"
                type="number"
                min="1"
                max="72"
                value={settings.reminder_hours}
                onChange={(e) => updateSetting("reminder_hours", Number.parseInt(e.target.value) || 24)}
              />
              <p className="text-xs text-gray-500">Tiempo antes del primer recordatorio</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalation_days">Escalamiento (días)</Label>
              <Input
                id="escalation_days"
                type="number"
                min="1"
                max="30"
                value={settings.escalation_days}
                onChange={(e) => updateSetting("escalation_days", Number.parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-gray-500">Días antes de escalar al administrador</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overdue_days">Vencido (días)</Label>
              <Input
                id="overdue_days"
                type="number"
                min="1"
                max="60"
                value={settings.overdue_days}
                onChange={(e) => updateSetting("overdue_days", Number.parseInt(e.target.value) || 7)}
              />
              <p className="text-xs text-gray-500">Días para marcar como vencido</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_frequency">Frecuencia de Recordatorios (horas)</Label>
            <Input
              id="reminder_frequency"
              type="number"
              min="1"
              max="48"
              value={settings.reminder_frequency_hours}
              onChange={(e) => updateSetting("reminder_frequency_hours", Number.parseInt(e.target.value) || 12)}
            />
            <p className="text-xs text-gray-500">Cada cuántas horas repetir recordatorios</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Configuración de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Configuración de Alertas
          </CardTitle>
          <CardDescription>Active o desactive diferentes tipos de notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Escalamiento Automático</Label>
              <p className="text-sm text-gray-500">Escalar automáticamente volantes pendientes</p>
            </div>
            <Switch
              checked={settings.auto_escalation}
              onCheckedChange={(checked) => updateSetting("auto_escalation", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones por Email</Label>
              <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Último procesamiento:</span> {new Date().toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Próxima verificación:</span> En 30 minutos
            </p>
            <p>
              <span className="font-medium">Estado del servicio:</span> <span className="text-green-600">Activo</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
    </div>
  )
}
