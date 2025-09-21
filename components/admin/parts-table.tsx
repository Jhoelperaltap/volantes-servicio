"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Package, ToggleLeft, ToggleRight } from "lucide-react"

interface Part {
  id: string
  name: string
  part_number: string
  description: string
  category: string
  is_active: boolean
  created_at: string
}

export function PartsTable() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParts()
  }, [])

  const fetchParts = async () => {
    try {
      const response = await fetch("/api/admin/parts")
      if (response.ok) {
        const data = await response.json()
        setParts(data)
      }
    } catch (error) {
      console.error("Error fetching parts:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePartStatus = async (partId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/parts/${partId}/toggle-status`, {
        method: "PATCH",
      })
      if (response.ok) {
        fetchParts()
      }
    } catch (error) {
      console.error("Error toggling part status:", error)
    }
  }

  const deletePart = async (partId: string) => {
    if (!confirm("¿Está seguro de eliminar este repuesto?")) return

    try {
      const response = await fetch(`/api/admin/parts/${partId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchParts()
      }
    } catch (error) {
      console.error("Error deleting part:", error)
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      Cables: "bg-blue-100 text-blue-800",
      "Equipos de Red": "bg-green-100 text-green-800",
      Alimentación: "bg-yellow-100 text-yellow-800",
      Conectores: "bg-purple-100 text-purple-800",
      Herramientas: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return <div className="text-center py-4">Cargando repuestos...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Número de Parte</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead className="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  {part.name}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{part.part_number}</code>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryBadge(part.category)}>{part.category}</Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm text-gray-600">{part.description}</div>
              </TableCell>
              <TableCell>
                <Badge variant={part.is_active ? "default" : "secondary"}>
                  {part.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>{new Date(part.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/repuestos/${part.id}/editar`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePartStatus(part.id, part.is_active)}>
                      {part.is_active ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => deletePart(part.id)}>
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
