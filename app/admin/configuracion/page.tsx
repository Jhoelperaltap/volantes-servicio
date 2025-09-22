"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Building2, Mail, Phone, MapPin, Save, Upload, X, ImageIcon, ArrowLeft } from "lucide-react"
import { EmailTest } from "@/components/admin/email-test"
import { SessionManagement } from "@/components/admin/session-management"
import { SessionSettings } from "@/components/admin/session-settings"
import { useRouter } from "next/navigation"

interface CompanySettings {
  id: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  logo_url: string | null
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/company-settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setLogoPreview(data.logo_url)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WebP",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es muy grande. Máximo 2MB permitido. Considera comprimir la imagen.",
        variant: "destructive",
      })
      return
    }

    if (file.size < 1024) {
      toast({
        title: "Error",
        description: "El archivo es muy pequeño. Asegúrate de subir una imagen válida.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Validar dimensiones mínimas
        if (img.width < 50 || img.height < 25) {
          toast({
            title: "Error",
            description: "La imagen es muy pequeña. Dimensiones mínimas: 50x25 píxeles.",
            variant: "destructive",
          })
          return
        }

        // Mostrar advertencia si la imagen es muy grande
        if (img.width > 1024 || img.height > 512) {
          toast({
            title: "Advertencia",
            description:
              "La imagen es muy grande. Se recomienda usar dimensiones de 256x128 píxeles para mejor rendimiento.",
            variant: "default",
          })
        }

        // Proceder con la subida
        uploadFile(file)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setLogoPreview(data.url)
        handleInputChange("logo_url", data.url)
        toast({
          title: "Éxito",
          description: `Logo subido correctamente (${(data.size / 1024).toFixed(1)}KB)`,
        })
      } else {
        throw new Error(data.error || "Error al subir el logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir el logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      handleLogoUpload(imageFile)
    } else {
      toast({
        title: "Error",
        description: "Por favor arrastra un archivo de imagen válido",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    handleInputChange("logo_url", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/company-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Configuración guardada correctamente",
        })
      } else {
        throw new Error("Error al guardar")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Panel
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Configuración de Empresa</h1>
          <p className="text-muted-foreground">
            Gestiona la información básica de tu empresa y configuraciones de seguridad
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Gestión de sesiones y configuración de sesiones */}
        <SessionManagement />
        <SessionSettings />

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
            <CardDescription>Datos básicos de la empresa que aparecerán en los volantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre de la Empresa</Label>
                <Input
                  id="company_name"
                  value={settings?.company_name || ""}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Nombre de tu empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_email">Email Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_email"
                    type="email"
                    className="pl-10"
                    value={settings?.company_email || ""}
                    onChange={(e) => handleInputChange("company_email", e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_phone"
                    className="pl-10"
                    value={settings?.company_phone || ""}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="company_address"
                  className="pl-10 min-h-[80px]"
                  value={settings?.company_address || ""}
                  onChange={(e) => handleInputChange("company_address", e.target.value)}
                  placeholder="Dirección completa de la empresa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo de la Empresa
            </CardTitle>
            <CardDescription>
              Sube el logo de tu empresa. Se mostrará en todos los volantes de servicio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="max-h-32 max-w-64 object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/company-logo-placeholder.jpg"
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Logo actual</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Arrastra tu logo aquí o haz clic para subir</p>
                    <p className="text-xs text-muted-foreground">Solo se permite carga de archivos de imagen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Subiendo..." : "Subir Logo"}
              </Button>
              {logoPreview && (
                <Button variant="outline" onClick={removeLogo}>
                  <X className="w-4 h-4 mr-2" />
                  Quitar
                </Button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium mb-1">Recomendaciones para el logo:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Formatos: JPG, PNG, GIF, WebP</li>
                <li>• Tamaño máximo: 2MB</li>
                <li>• Dimensiones recomendadas: 256x128px</li>
                <li>• Fondo transparente (PNG) para mejor integración</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={fetchSettings}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>

        {/* Sección de prueba de email */}
        <EmailTest />
      </div>
    </div>
  )
}
