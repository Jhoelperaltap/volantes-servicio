"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LocationForm } from "@/components/admin/location-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  contact_person: string
  contact_phone: string
  contact_email: string
}

export default function EditarLocalidadPage() {
  const params = useParams()
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchLocation(params.id as string)
    }
  }, [params.id])

  const fetchLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/locations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setLocation(data)
      } else {
        setError("No se pudo cargar la localidad")
      }
    } catch (error) {
      console.error("Error fetching location:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando localidad...</p>
        </div>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || "Localidad no encontrada"}</p>
          <Button onClick={() => router.push("/admin/localidades")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Localidades
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header con navegación */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/localidades")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Localidades
        </Button>

        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Editar Localidad</h1>
            <p className="text-muted-foreground">Modifica la información de: {location.name}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg border p-6">
        <LocationForm initialData={location} />
      </div>
    </div>
  )
}
