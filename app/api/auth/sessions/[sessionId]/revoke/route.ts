import { NextResponse, type NextRequest } from "next/server"
import { SessionManager } from "@/lib/session-manager"
import { query } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const result = await query(
      "SELECT token_id, user_id, expires_at FROM user_sessions WHERE id = $1 AND user_id = $2 AND is_active = true",
      [sessionId, userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    await SessionManager.logout(result.rows[0].token_id)

    return NextResponse.json({
      success: true,
      message: "Sesión revocada exitosamente",
    })
  } catch (error) {
    console.error("Error revocando sesión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
