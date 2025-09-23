import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] ==> PUT equipment route STARTED")
  console.log("[v0] Equipment ID from params:", params.id)
  console.log("[v0] Request URL:", request.url)
  console.log("[v0] Request method:", request.method)

  try {
    const userRole = request.headers.get("x-user-role")
    console.log("[v0] User role from headers:", userRole)

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      console.log("[v0] Authorization failed, role:", userRole)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] Request body received:", JSON.stringify(body, null, 2))

    const {
      location_id,
      name,
      model,
      serial_number,
      brand,
      equipment_type,
      description,
      installation_date,
      warranty_expiry,
      is_active,
    } = body

    if (!location_id || !name) {
      console.log("[v0] Validation failed - missing required fields")
      return NextResponse.json({ error: "La localidad y el nombre son requeridos" }, { status: 400 })
    }

    console.log("[v0] About to execute UPDATE query for equipment ID:", params.id)
    const result = await query(
      `UPDATE equipment 
       SET location_id = $1, name = $2, model = $3, serial_number = $4, brand = $5, 
           equipment_type = $6, description = $7, installation_date = $8, 
           warranty_expiry = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        location_id,
        name,
        model,
        serial_number,
        brand,
        equipment_type,
        description,
        installation_date,
        warranty_expiry,
        is_active,
        params.id,
      ],
    )

    console.log("[v0] Query executed successfully, rows affected:", result.rows.length)

    if (result.rows.length === 0) {
      console.log("[v0] Equipment not found with ID:", params.id)
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    console.log("[v0] Equipment updated successfully:", result.rows[0])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Error updating equipment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const ticketsCheck = await query("SELECT COUNT(*) as count FROM service_tickets WHERE equipment_id = $1", [
      params.id,
    ])

    if (Number.parseInt(ticketsCheck.rows[0].count) > 0) {
      const result = await query(
        "UPDATE equipment SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [params.id],
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Equipo desactivado (tiene volantes asociados)",
        equipment: result.rows[0],
      })
    }

    const result = await query("DELETE FROM equipment WHERE id = $1 RETURNING *", [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Equipo eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(
      `SELECT 
        eq.*,
        loc.name as location_name,
        cl.name as client_name,
        c.name as company_name
      FROM equipment eq
      JOIN client_locations loc ON eq.location_id = loc.id
      JOIN clients cl ON loc.client_id = cl.id
      JOIN companies c ON cl.company_id = c.id
      WHERE eq.id = $1`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
