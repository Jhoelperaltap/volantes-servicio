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

interface EquipmentType {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
}

interface EquipmentTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentType?: EquipmentType | null
  onSuccess: () => void
}

export function EquipmentTypeFormDialog({
  open,
  onOpenChange,
  equipmentType,
  onSuccess,
}: EquipmentTypeFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (equipmentType) {
      setFormData({
        name: equipmentType.name || "",
        display_name: equipmentType.display_name || "",
        description: equipmentType.description || "",
        is_active: equipmentType.is_active,
      })
    } else {
      setFormData({
        name: "",
        display_name: "",
        description: "",
        is_active: true,
      })
    }
    setError("")
  }, [equipmentType, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.display_name) {
      setError("El nombre y nombre para mostrar son obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = equipmentType ? `/api/admin/equipment-types/${equipmentType.id}` : "/api/admin/equipment-types"
      const method = equipmentType ? "PUT" : "POST"

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
        setError(errorData.error || "Error al guardar el tipo de equipo")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{equipmentType ? "Editar Tipo de Equipo" : "Nuevo Tipo de Equipo"}</DialogTitle>
          <DialogDescription>
            {equipmentType
              ? "Modifica los datos del tipo de equipo"
              : "Completa los datos para crear un nuevo tipo de equipo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre (clave) *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="aire_acondicionado"
              required
            />
            <p className="text-xs text-muted-foreground">Nombre interno del tipo (sin espacios, usar guiones bajos)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Nombre para mostrar *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Aire Acondicionado"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del tipo de equipo"
              rows={3}
            />
          </div>

          {equipmentType && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Tipo activo</Label>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : equipmentType ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
