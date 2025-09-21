import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT * FROM parts 
      ORDER BY category ASC, name ASC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching parts:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { name, part_number, description, category, is_active } = await request.json()

    if (!name || !part_number || !category) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    // Verificar que el número de parte no exista
    const existingPart = await query("SELECT id FROM parts WHERE part_number = $1", [part_number])
    if (existingPart.rows.length > 0) {
      return NextResponse.json({ error: "El número de parte ya existe" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO parts (name, part_number, description, category, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, part_number, description || null, category, is_active ?? true],
    )

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Error creating part:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
