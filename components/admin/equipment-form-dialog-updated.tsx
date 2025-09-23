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

interface Equipment {
  id: string
  location_id: string
  name: string
  model?: string
  serial_number?: string
  brand?: string
  equipment_type?: string
  description?: string
  is_active: boolean
}

interface Location {
  id: string
  name: string
  client_name: string
  company_name: string
}

interface EquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipment | null
  onSuccess: () => void
}

export function EquipmentFormDialog({ open, onOpenChange, equipment, onSuccess }: EquipmentFormDialogProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [formData, setFormData] = useState({
    location_id: "",
    name: "",
    model: "",
    serial_number: "",
    brand: "",
    equipment_type: "",
    description: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchLocations()
    }
  }, [open])

  useEffect(() => {
    if (equipment) {
      setFormData({
        location_id: equipment.location_id || "",
        name: equipment.name || "",
        model: equipment.model || "",
        serial_number: equipment.serial_number || "",
        brand: equipment.brand || "",
        equipment_type: equipment.equipment_type || "",
        description: equipment.description || "",
        is_active: equipment.is_active,
      })
    } else {
      setFormData({
        location_id: "",
        name: "",
        model: "",
        serial_number: "",
        brand: "",
        equipment_type: "",
        description: "",
        is_active: true,
      })
    }
    setError("")
  }, [equipment, open])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations-new")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.location_id) {
      setError("Nombre y localidad son obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = equipment ? `/api/admin/equipment/${equipment.id}` : "/api/admin/equipment"
      const method = equipment ? "PUT" : "POST"

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
        setError(errorData.error || "Error al guardar el equipo")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{equipment ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle>
          <DialogDescription>
            {equipment ? "Modifica los datos del equipo" : "Completa los datos para crear un nuevo equipo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_id">Localidad *</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar localidad" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.company_name} → {location.client_name} → {location.name}
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
                placeholder="Nombre del equipo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Marca del equipo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Modelo del equipo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Número de Serie</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Número de serie"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_type">Tipo de Equipo</Label>
            <Select
              value={formData.equipment_type}
              onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aire_acondicionado">Aire Acondicionado</SelectItem>
                <SelectItem value="refrigeracion">Refrigeración</SelectItem>
                <SelectItem value="calefaccion">Calefacción</SelectItem>
                <SelectItem value="ventilacion">Ventilación</SelectItem>
                <SelectItem value="electrodomestico">Electrodoméstico</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del equipo"
              rows={3}
            />
          </div>

          {equipment && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Equipo activo</Label>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : equipment ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
