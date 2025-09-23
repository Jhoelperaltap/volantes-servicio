import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT 
        eq.*,
        loc.name as location_name,
        cl.name as client_name,
        c.name as company_name
      FROM equipment eq
      JOIN client_locations loc ON eq.location_id = loc.id
      JOIN clients cl ON loc.client_id = cl.id
      JOIN companies c ON cl.company_id = c.id
      WHERE eq.is_active = true AND loc.is_active = true AND cl.is_active = true AND c.is_active = true
      ORDER BY c.name, cl.name, loc.name, eq.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
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
    } = body

    if (!location_id || !name) {
      return NextResponse.json({ error: "La localidad y el nombre son requeridos" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO equipment (location_id, name, model, serial_number, brand, equipment_type, description, installation_date, warranty_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [location_id, name, model, serial_number, brand, equipment_type, description, installation_date, warranty_expiry],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
