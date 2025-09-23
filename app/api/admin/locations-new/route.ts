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
        loc.*,
        cl.name as client_name,
        c.name as company_name,
        COUNT(eq.id) as equipment_count
      FROM client_locations loc
      JOIN clients cl ON loc.client_id = cl.id
      JOIN companies c ON cl.company_id = c.id
      LEFT JOIN equipment eq ON loc.id = eq.location_id AND eq.is_active = true
      WHERE loc.is_active = true AND cl.is_active = true AND c.is_active = true
      GROUP BY loc.id, loc.client_id, loc.name, loc.address, loc.city, loc.state, loc.country, loc.contact_person, loc.contact_phone, loc.contact_email, loc.is_active, loc.created_at, loc.updated_at, cl.name, c.name
      ORDER BY c.name, cl.name, loc.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching locations:", error)
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
    const { client_id, name, address, city, state, country, contact_person, contact_phone, contact_email } = body

    if (!client_id || !name) {
      return NextResponse.json({ error: "El cliente y el nombre son requeridos" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO client_locations (client_id, name, address, city, state, country, contact_person, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        client_id,
        name,
        address,
        city,
        state,
        country || "República Dominicana",
        contact_person,
        contact_phone,
        contact_email,
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
