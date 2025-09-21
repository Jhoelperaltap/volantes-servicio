"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Hash, FileText, Tag } from "lucide-react"

interface PartFormProps {
  initialData?: {
    id?: string
    name: string
    part_number: string
    description: string
    category: string
    is_active: boolean
  }
}

const categories = [
  "Cables",
  "Equipos de Red",
  "Alimentación",
  "Conectores",
  "Herramientas",
  "Componentes Electrónicos",
  "Accesorios",
  "Otros",
]

export function PartForm({ initialData }: PartFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    part_number: initialData?.part_number || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    is_active: initialData?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.part_number || !formData.category) {
      setError("Por favor complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = initialData?.id ? `/api/admin/parts/${initialData.id}` : "/api/admin/parts"
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        router.push("/admin/repuestos")
      } else {
        setError(result.error || "Error al guardar el repuesto")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre del Repuesto <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="Ej: Cable UTP Cat6"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="part_number">
            Número de Parte <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="part_number"
              placeholder="Ej: CAB-UTP-001"
              value={formData.part_number}
              onChange={(e) => updateField("part_number", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Categoría <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {category}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Textarea
            id="description"
            placeholder="Descripción técnica del repuesto..."
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="pl-10"
            rows={3}
          />
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label>Estado del Repuesto</Label>
          <p className="text-sm text-gray-500">
            {formData.is_active ? "Activo y disponible para uso" : "Inactivo, no aparecerá en formularios"}
          </p>
        </div>
        <Switch checked={formData.is_active} onCheckedChange={(checked) => updateField("is_active", checked)} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : initialData?.id ? "Actualizar Repuesto" : "Crear Repuesto"}
        </Button>
      </div>
    </form>
  )
}
