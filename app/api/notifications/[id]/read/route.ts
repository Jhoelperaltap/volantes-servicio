import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    await query("UPDATE notifications SET is_read = true WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
