"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SignaturePad } from "./signature-pad"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  X,
  Package,
  MapPin,
  PenTool,
  Upload,
  ImageIcon,
  Building2,
  Users,
  Wrench,
  ChevronRight,
} from "lucide-react"

interface Company {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  address: string
  city: string
}

interface Equipment {
  id: string
  name: string
  model?: string
  serial_number?: string
  equipment_type?: string
}

interface Part {
  id: string
  name: string
  part_number: string
  description: string
  category: string
}

interface UsedPart {
  partId: string
  name: string
  quantity: number
  notes?: string
}

export function ServiceTicketForm() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])

  const [parts, setParts] = useState<Part[]>([])
  const [usedParts, setUsedParts] = useState<UsedPart[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const [imageUrl, setImageUrl] = useState<string>("")
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    companyId: "",
    clientId: "",
    locationId: "",
    equipmentId: "",
    serviceType: "",
    description: "",
    workPerformed: "",
    requiresReturn: false,
    pendingItems: "",
    status: "completado",
  })

  const [signatures, setSignatures] = useState({
    technician: "",
    client: "",
  })

  useEffect(() => {
    fetchCompanies()
    fetchParts()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/cascade-selection")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const fetchClients = async (companyId: string) => {
    try {
      const response = await fetch(`/api/cascade-selection?company_id=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setLocations([])
        setEquipment([])
        setFormData((prev) => ({ ...prev, clientId: "", locationId: "", equipmentId: "" }))
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchLocations = async (companyId: string, clientId: string) => {
    try {
      const response = await fetch(`/api/cascade-selection?company_id=${companyId}&client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
        setEquipment([])
        setFormData((prev) => ({ ...prev, locationId: "", equipmentId: "" }))
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const fetchEquipment = async (companyId: string, clientId: string, locationId: string) => {
    try {
      const response = await fetch(
        `/api/cascade-selection?company_id=${companyId}&client_id=${clientId}&location_id=${locationId}`,
      )
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment || [])
        setFormData((prev) => ({ ...prev, equipmentId: "" }))
      }
    } catch (error) {
      console.error("Error fetching equipment:", error)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    setFormData((prev) => ({ ...prev, companyId }))
    if (companyId) {
      fetchClients(companyId)
    } else {
      setClients([])
      setLocations([])
      setEquipment([])
    }
  }

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId }))
    if (clientId && formData.companyId) {
      fetchLocations(formData.companyId, clientId)
    } else {
      setLocations([])
      setEquipment([])
    }
  }

  const handleLocationChange = (locationId: string) => {
    setFormData((prev) => ({ ...prev, locationId }))
    if (locationId && formData.companyId && formData.clientId) {
      fetchEquipment(formData.companyId, formData.clientId, locationId)
    } else {
      setEquipment([])
    }
  }

  const fetchParts = async () => {
    try {
      const response = await fetch("/api/parts")
      if (response.ok) {
        const data = await response.json()
        setParts(data)
      }
    } catch (error) {
      console.error("Error fetching parts:", error)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo es muy grande. Máximo 10MB permitido")
      return
    }

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/ticket-image", {
        method: "POST",
        headers: {
          "x-user-id": "development-user",
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setImageUrl(data.url)
        setError("")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Error al subir la imagen" }))
        throw new Error(errorData.error || "Error al subir la imagen")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      setError(error instanceof Error ? error.message : "No se pudo subir la imagen")
    } finally {
      setImageUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setImageUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const addUsedPart = () => {
    setUsedParts([...usedParts, { partId: "", name: "", quantity: 1 }])
  }

  const removeUsedPart = (index: number) => {
    setUsedParts(usedParts.filter((_, i) => i !== index))
  }

  const updateUsedPart = (index: number, field: keyof UsedPart, value: any) => {
    const updated = [...usedParts]
    if (field === "partId") {
      const selectedPart = parts.find((p) => p.id === value)
      if (selectedPart) {
        updated[index] = { ...updated[index], partId: value, name: selectedPart.name }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setUsedParts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (
      !formData.companyId ||
      !formData.clientId ||
      !formData.locationId ||
      !formData.equipmentId ||
      !formData.serviceType ||
      !formData.description
    ) {
      setError("Por favor complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    if (!signatures.technician || !signatures.client) {
      setError("Se requieren ambas firmas para completar el volante")
      setLoading(false)
      return
    }

    try {
      const ticketData = {
        ...formData,
        partsUsed: usedParts,
        technicianSignature: signatures.technician,
        clientSignature: signatures.client,
        imageUrl: imageUrl || null,
      }

      const response = await fetch("/api/service-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      })

      const result = await response.json()

      if (response.ok) {
        router.push(`/volantes/${result.id}`)
      } else {
        setError(result.error || "Error al crear el volante")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Selección de Ubicación y Equipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company">
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.companyId} onValueChange={handleCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.companyId && (
            <div className="space-y-2">
              <Label htmlFor="client">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.clientId} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {client.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.clientId && (
            <div className="space-y-2">
              <Label htmlFor="location">
                Localidad <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.locationId} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar localidad" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-gray-500">
                            {location.address} {location.city && `- ${location.city}`}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.locationId && (
            <div className="space-y-2">
              <Label htmlFor="equipment">
                Equipo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.model && `${item.model} `}
                            {item.serial_number && `- S/N: ${item.serial_number}`}
                            {item.equipment_type && ` (${item.equipment_type})`}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.companyId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Ruta:</span>
                <div className="flex items-center gap-1">
                  {companies.find((c) => c.id === formData.companyId)?.name}
                  {formData.clientId && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      {clients.find((c) => c.id === formData.clientId)?.name}
                    </>
                  )}
                  {formData.locationId && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      {locations.find((l) => l.id === formData.locationId)?.name}
                    </>
                  )}
                  {formData.equipmentId && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      {equipment.find((e) => e.id === formData.equipmentId)?.name}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="location">
            Localidad <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.locationId}
            onValueChange={(value) => setFormData({ ...formData, locationId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar localidad" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-500">
                        {location.address} {location.city && `- ${location.city}`}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceType">
            Tipo de Servicio <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.serviceType}
            onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="reparacion">Reparación</SelectItem>
              <SelectItem value="instalacion">Instalación</SelectItem>
              <SelectItem value="cambio_repuesto">Cambio de Repuesto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción del Problema/Solicitud <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describa el problema o solicitud de servicio..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Imagen de Referencia (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageUrl ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Imagen del volante"
                  className="max-h-64 max-w-full object-contain rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Imagen adjunta al volante</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No hay imagen adjunta</p>
                  <p className="text-xs text-muted-foreground">
                    Puedes agregar una imagen para documentar el problema o trabajo realizado
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {imageUploading ? "Subiendo..." : imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
            </Button>
            {imageUrl && (
              <Button type="button" variant="outline" onClick={removeImage}>
                <X className="w-4 h-4 mr-2" />
                Quitar
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 10MB.</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="workPerformed">Trabajo Realizado</Label>
        <Textarea
          id="workPerformed"
          placeholder="Describa el trabajo realizado..."
          value={formData.workPerformed}
          onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
          rows={4}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Repuestos Utilizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usedParts.map((usedPart, index) => (
            <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label>Repuesto</Label>
                <Select value={usedPart.partId} onValueChange={(value) => updateUsedPart(index, "partId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar repuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        <div>
                          <div className="font-medium">{part.name}</div>
                          <div className="text-sm text-gray-500">
                            {part.part_number} - {part.category}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={usedPart.quantity}
                  onChange={(e) => updateUsedPart(index, "quantity", Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex-1">
                <Label>Notas</Label>
                <Input
                  placeholder="Notas adicionales..."
                  value={usedPart.notes || ""}
                  onChange={(e) => updateUsedPart(index, "notes", e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => removeUsedPart(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addUsedPart} className="w-full bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Repuesto
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresReturn"
              checked={formData.requiresReturn}
              onCheckedChange={(checked) => setFormData({ ...formData, requiresReturn: checked as boolean })}
            />
            <Label htmlFor="requiresReturn">Requiere visita de seguimiento</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado del Servicio</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(formData.requiresReturn || formData.status === "pendiente") && (
          <div className="space-y-2">
            <Label htmlFor="pendingItems">Items Pendientes</Label>
            <Textarea
              id="pendingItems"
              placeholder="Describa qué queda pendiente..."
              value={formData.pendingItems}
              onChange={(e) => setFormData({ ...formData, pendingItems: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          Firmas Digitales
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Firma del Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <SignaturePad
                onSignatureChange={(signature) => setSignatures({ ...signatures, technician: signature })}
                placeholder="Firma del técnico que realizó el servicio"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Firma del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <SignaturePad
                onSignatureChange={(signature) => setSignatures({ ...signatures, client: signature })}
                placeholder="Firma de quien recibe el servicio"
              />
            </CardContent>
          </Card>
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
          {loading ? "Creando volante..." : "Crear Volante de Servicio"}
        </Button>
      </div>
    </form>
  )
}
