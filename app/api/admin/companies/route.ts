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
        c.*,
        COUNT(cl.id) as clients_count
      FROM companies c
      LEFT JOIN clients cl ON c.id = cl.company_id AND cl.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.description, c.address, c.contact_person, c.contact_phone, c.contact_email, c.is_active, c.created_at, c.updated_at
      ORDER BY c.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching companies:", error)
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
    const { name, description, address, contact_person, contact_phone, contact_email } = body

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO companies (name, description, address, contact_person, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, address, contact_person, contact_phone, contact_email],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
