"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { EquipmentTypeFormDialog } from "@/components/admin/equipment-type-form-dialog"

interface EquipmentType {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EquipmentTypesPage() {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(null)

  useEffect(() => {
    fetchEquipmentTypes()
  }, [])

  const fetchEquipmentTypes = async () => {
    try {
      const response = await fetch("/api/admin/equipment-types")
      if (response.ok) {
        const data = await response.json()
        setEquipmentTypes(data)
      }
    } catch (error) {
      console.error("Error fetching equipment types:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (equipmentType: EquipmentType) => {
    setSelectedType(equipmentType)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este tipo de equipo?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/equipment-types/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEquipmentTypes()
      } else {
        const error = await response.json()
        alert(error.message || "Error al eliminar el tipo de equipo")
      }
    } catch (error) {
      console.error("Error deleting equipment type:", error)
      alert("Error de conexión")
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedType(null)
  }

  if (loading) {
    return <div className="p-6">Cargando tipos de equipo...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Equipo</h1>
          <p className="text-muted-foreground">Gestiona los tipos de equipos disponibles en el sistema</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipmentTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{type.display_name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">{type.name}</CardDescription>
                </div>
                <Badge variant={type.is_active ? "default" : "secondary"}>
                  {type.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {type.description && <p className="text-sm text-muted-foreground mb-4">{type.description}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {equipmentTypes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No hay tipos de equipo registrados</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer tipo de equipo
            </Button>
          </CardContent>
        </Card>
      )}

      <EquipmentTypeFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        equipmentType={selectedType}
        onSuccess={() => {
          fetchEquipmentTypes()
          handleDialogClose()
        }}
      />
    </div>
  )
}
