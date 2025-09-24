import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const result = await query("SELECT * FROM locations ORDER BY name")
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Error fetching locations:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
