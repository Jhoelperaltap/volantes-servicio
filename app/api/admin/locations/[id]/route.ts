import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["tecnico", "admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const result = await query("SELECT * FROM locations WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Localidad no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["tecnico", "admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const { name, address, contact_person, contact_phone, contact_email } = await request.json()

    if (!name || !address || !contact_person) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    await query(
      `UPDATE locations 
       SET name = $1, address = $2, contact_person = $3, contact_phone = $4, contact_email = $5
       WHERE id = $6`,
      [name, address, contact_person, contact_phone || null, contact_email || null, id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Verificar si la localidad tiene volantes asociados
    const ticketsResult = await query("SELECT COUNT(*) as count FROM service_tickets WHERE location_id = $1", [id])
    const ticketCount = Number.parseInt(ticketsResult.rows[0].count)

    if (ticketCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la localidad porque tiene volantes asociados" },
        { status: 400 },
      )
    }

    await query("DELETE FROM locations WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
