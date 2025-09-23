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

interface Company {
  id: string
  name: string
  description?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
}

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
  onSuccess: () => void
}

export function CompanyFormDialog({ open, onOpenChange, company, onSuccess }: CompanyFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        description: company.description || "",
        address: company.address || "",
        contact_person: company.contact_person || "",
        contact_phone: company.contact_phone || "",
        contact_email: company.contact_email || "",
        is_active: company.is_active,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        address: "",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        is_active: true,
      })
    }
    setError("")
  }, [company, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = company ? `/api/admin/companies/${company.id}` : "/api/admin/companies"
      const method = company ? "PUT" : "POST"

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
        setError(errorData.error || "Error al guardar la empresa")
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
          <DialogTitle>{company ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
          <DialogDescription>
            {company ? "Modifica los datos de la empresa" : "Completa los datos para crear una nueva empresa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Persona de Contacto</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la empresa"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección de la empresa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="Teléfono de contacto"
              />
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
          </div>

          {company && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Empresa activa</Label>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : company ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
