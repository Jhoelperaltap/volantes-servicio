import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query("SELECT * FROM parts WHERE is_active = true ORDER BY category, name")
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching parts:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
