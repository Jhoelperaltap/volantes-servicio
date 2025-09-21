"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, User, Phone, Mail } from "lucide-react"

interface LocationFormProps {
  initialData?: {
    id?: string
    name: string
    address: string
    contact_person: string
    contact_phone: string
    contact_email: string
  }
}

export function LocationForm({ initialData }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    address: initialData?.address || "",
    contact_person: initialData?.contact_person || "",
    contact_phone: initialData?.contact_phone || "",
    contact_email: initialData?.contact_email || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name || !formData.address || !formData.contact_person) {
      setError("Por favor complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    try {
      const url = initialData?.id ? `/api/admin/locations/${initialData.id}` : "/api/admin/locations"
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
        router.push("/admin/localidades")
      } else {
        setError(result.error || "Error al guardar la localidad")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre de la Localidad <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="Ej: Sucursal Centro"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">
            Persona de Contacto <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="contact_person"
              placeholder="Nombre del responsable"
              value={formData.contact_person}
              onChange={(e) => updateField("contact_person", e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address">
          Dirección Completa <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          placeholder="Dirección completa de la localidad..."
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          rows={3}
          required
        />
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="contact_phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.contact_phone}
              onChange={(e) => updateField("contact_phone", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Correo Electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="contact_email"
              type="email"
              placeholder="contacto@localidad.com"
              value={formData.contact_email}
              onChange={(e) => updateField("contact_email", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
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
          {loading ? "Guardando..." : initialData?.id ? "Actualizar Localidad" : "Crear Localidad"}
        </Button>
      </div>
    </form>
  )
}
