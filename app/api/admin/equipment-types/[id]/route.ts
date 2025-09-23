import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, display_name, description, is_active } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: "El nombre y nombre para mostrar son requeridos" }, { status: 400 })
    }

    // Verificar que el nombre no exista en otro registro
    const existingType = await query("SELECT id FROM equipment_types WHERE name = $1 AND id != $2", [name, params.id])
    if (existingType.rows.length > 0) {
      return NextResponse.json({ error: "Ya existe un tipo de equipo con ese nombre" }, { status: 400 })
    }

    const result = await query(
      `UPDATE equipment_types 
       SET name = $1, display_name = $2, description = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, display_name, description, is_active, params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tipo de equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating equipment type:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar si hay equipos usando este tipo
    const equipmentCheck = await query(
      "SELECT COUNT(*) as count FROM equipment WHERE equipment_type = (SELECT name FROM equipment_types WHERE id = $1)",
      [params.id],
    )

    if (Number.parseInt(equipmentCheck.rows[0].count) > 0) {
      // Desactivar en lugar de eliminar si hay equipos asociados
      const result = await query(
        "UPDATE equipment_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [params.id],
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Tipo de equipo no encontrado" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Tipo de equipo desactivado (tiene equipos asociados)",
        equipmentType: result.rows[0],
      })
    }

    // Eliminar si no hay equipos asociados
    const result = await query("DELETE FROM equipment_types WHERE id = $1 RETURNING *", [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tipo de equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Tipo de equipo eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting equipment type:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query("SELECT * FROM equipment_types WHERE id = $1", [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tipo de equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching equipment type:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
