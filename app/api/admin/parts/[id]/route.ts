import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = params
    const { name, part_number, description, category, is_active } = await request.json()

    if (!name || !part_number || !category) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    // Verificar que el número de parte no exista en otro repuesto
    const existingPart = await query("SELECT id FROM parts WHERE part_number = $1 AND id != $2", [part_number, id])
    if (existingPart.rows.length > 0) {
      return NextResponse.json({ error: "El número de parte ya existe" }, { status: 400 })
    }

    await query(
      `UPDATE parts 
       SET name = $1, part_number = $2, description = $3, category = $4, is_active = $5
       WHERE id = $6`,
      [name, part_number, description || null, category, is_active ?? true, id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating part:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = params

    await query("DELETE FROM parts WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting part:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
