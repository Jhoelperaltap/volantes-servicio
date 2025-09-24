import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT * FROM equipment_types 
      WHERE is_active = true 
      ORDER BY display_name
    `)

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error("[v0] Equipment Types GET - Error:", error.message, error.stack)
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
    const { name, display_name, description } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: "El nombre y nombre para mostrar son requeridos" }, { status: 400 })
    }

    // Verificar que el nombre no exista
    const existingType = await query("SELECT id FROM equipment_types WHERE name = $1", [name])
    if (existingType.rows.length > 0) {
      return NextResponse.json({ error: "Ya existe un tipo de equipo con ese nombre" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO equipment_types (name, display_name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, display_name, description],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Equipment Types POST - Error:", error.message, error.stack)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
