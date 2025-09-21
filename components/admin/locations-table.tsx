"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, MapPin, Phone, Mail } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  contact_person: string
  contact_phone: string
  contact_email: string
  created_at: string
}

export function LocationsTable() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteLocation = async (locationId: string) => {
    if (!confirm("¿Está seguro de eliminar esta localidad?")) return

    try {
      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchLocations()
      }
    } catch (error) {
      console.error("Error deleting location:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Cargando localidades...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Información</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead className="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {location.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">{location.address}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{location.contact_person}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {location.contact_phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {location.contact_phone}
                    </div>
                  )}
                  {location.contact_email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {location.contact_email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(location.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/localidades/${location.id}/editar`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteLocation(location.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
