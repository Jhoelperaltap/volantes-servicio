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

interface Client {
  id: string
  company_id: string
  name: string
  description?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
}

interface Company {
  id: string
  name: string
}

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    company_id: "",
    name: "",
    description: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchCompanies()
    }
  }, [open])

  useEffect(() => {
    if (client) {
      setFormData({
        company_id: client.company_id || "",
        name: client.name || "",
        description: client.description || "",
        contact_person: client.contact_person || "",
        contact_phone: client.contact_phone || "",
        contact_email: client.contact_email || "",
        is_active: client.is_active,
      })
    } else {
      setFormData({
        company_id: "",
        name: "",
        description: "",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        is_active: true,
      })
    }
    setError("")
  }, [client, open])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.company_id) {
      setError("Nombre y empresa son obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = client ? `/api/admin/clients/${client.id}` : "/api/admin/clients"
      const method = client ? "PUT" : "POST"

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
        setError(errorData.error || "Error al guardar el cliente")
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
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Modifica los datos del cliente" : "Completa los datos para crear un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa *</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
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
                placeholder="Nombre del cliente"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del cliente"
              rows={3}
            />
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

          {client && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Cliente activo</Label>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : client ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
