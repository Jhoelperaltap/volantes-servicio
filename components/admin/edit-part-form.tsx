"use client"

import { useEffect, useState } from "react"
import { PartForm } from "./part-form"

interface EditPartFormProps {
  partId: string
}

interface PartData {
  id: string
  name: string
  part_number: string
  description: string
  category: string
  is_active: boolean
}

export function EditPartForm({ partId }: EditPartFormProps) {
  const [partData, setPartData] = useState<PartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPartData()
  }, [partId])

  const fetchPartData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/parts/${partId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPartData(data)
      } else {
        setError("Error al cargar los datos del repuesto")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Cargando datos del repuesto...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">{error}</div>
  }

  if (!partData) {
    return <div className="text-center py-4">Repuesto no encontrado</div>
  }

  return <PartForm initialData={partData} />
}
