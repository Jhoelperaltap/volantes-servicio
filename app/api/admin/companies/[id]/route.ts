import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`SELECT * FROM companies WHERE id = $1 AND is_active = true`, [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching company:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, address, contact_person, contact_phone, contact_email, is_active } = body

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const result = await query(
      `UPDATE companies 
       SET name = $1, description = $2, address = $3, contact_person = $4, 
           contact_phone = $5, contact_email = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND is_active = true
       RETURNING *`,
      [name, description, address, contact_person, contact_phone, contact_email, is_active ?? true, params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Verificar si la empresa tiene clientes activos
    const clientsCheck = await query(
      `SELECT COUNT(*) as count FROM clients WHERE company_id = $1 AND is_active = true`,
      [params.id],
    )

    if (Number.parseInt(clientsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una empresa que tiene clientes activos" },
        { status: 400 },
      )
    }

    // Soft delete - marcar como inactiva
    const result = await query(
      `UPDATE companies 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Empresa eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
