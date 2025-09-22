import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: Request) {
  try {
    console.log("[v0] Locations API - Request received")
    console.log("[v0] Locations API - Headers:", Object.fromEntries(request.headers.entries()))

    const result = await query("SELECT * FROM locations ORDER BY name")
    console.log("[v0] Locations API - Query successful, rows:", result.rows.length)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
