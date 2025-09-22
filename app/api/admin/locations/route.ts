import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["tecnico", "admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT * FROM locations 
      ORDER BY name ASC
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

    if (!userRole || !["tecnico", "admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { name, address, contact_person, contact_phone, contact_email } = await request.json()

    if (!name || !address || !contact_person) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO locations (name, address, contact_person, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, address, contact_person, contact_phone || null, contact_email || null],
    )

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
