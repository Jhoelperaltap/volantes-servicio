import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    await query("UPDATE parts SET is_active = NOT is_active WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling part status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
