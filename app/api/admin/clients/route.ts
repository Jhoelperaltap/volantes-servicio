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
        cl.*,
        c.name as company_name,
        COUNT(loc.id) as locations_count
      FROM clients cl
      JOIN companies c ON cl.company_id = c.id
      LEFT JOIN client_locations loc ON cl.id = loc.client_id AND loc.is_active = true
      WHERE cl.is_active = true AND c.is_active = true
      GROUP BY cl.id, cl.company_id, cl.name, cl.description, cl.contact_person, cl.contact_phone, cl.contact_email, cl.is_active, cl.created_at, cl.updated_at, c.name
      ORDER BY c.name, cl.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching clients:", error)
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
    const { company_id, name, description, contact_person, contact_phone, contact_email } = body

    if (!company_id || !name) {
      return NextResponse.json({ error: "La empresa y el nombre son requeridos" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO clients (company_id, name, description, contact_person, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [company_id, name, description, contact_person, contact_phone, contact_email],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
