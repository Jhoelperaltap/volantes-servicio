"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Location {
  id: string
  client_id: string
  name: string
  address?: string
  city?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
}

interface Client {
  id: string
  name: string
  company_name: string
}

interface LocationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location?: Location | null
  onSuccess: () => void
}

export function LocationFormDialog({ open, onOpenChange, location, onSuccess }: LocationFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    address: "",
    city: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open])

  useEffect(() => {
    if (location) {
      setFormData({
        client_id: location.client_id || "",
        name: location.name || "",
        address: location.address || "",
        city: location.city || "",
        contact_person: location.contact_person || "",
        contact_phone: location.contact_phone || "",
        contact_email: location.contact_email || "",
        is_active: location.is_active,
      })
    } else {
      setFormData({
        client_id: "",
        name: "",
        address: "",
        city: "",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        is_active: true,
      })
    }
    setError("")
  }, [location, open])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.client_id) {
      setError("Nombre y cliente son obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = location ? `/api/admin/locations-new/${location.id}` : "/api/admin/locations-new"
      const method = location ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Error al guardar la localidad")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{location ? "Editar Localidad" : "Nueva Localidad"}</DialogTitle>
          <DialogDescription>
            {location ? "Modifica los datos de la localidad" : "Completa los datos para crear una nueva localidad"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name} → {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la localidad"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ciudad"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Persona de Contacto</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="Email de contacto"
            />
          </div>

          {location && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Localidad activa</Label>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : location ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
