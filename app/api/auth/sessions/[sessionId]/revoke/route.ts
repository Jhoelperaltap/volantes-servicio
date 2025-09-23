import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    console.log("[v0] POST /api/auth/sessions/[sessionId]/revoke - Iniciando")

    const { sessionId } = await params
    const userId = request.headers.get("x-user-id")

    console.log("[v0] SessionId recibido:", sessionId)
    console.log("[v0] UserId del header:", userId)

    if (!userId) {
      console.log("[v0] Error: Usuario no autenticado")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("[v0] Consultando sesión en BD...")
    const result = await query(
      "SELECT id, user_id FROM user_sessions WHERE id = $1 AND user_id = $2 AND is_active = true",
      [sessionId, userId],
    )

    console.log("[v0] Resultado de consulta:", result.rows)

    if (result.rows.length === 0) {
      console.log("[v0] Error: Sesión no encontrada")
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    console.log("[v0] Desactivando sesión...")
    await query("UPDATE user_sessions SET is_active = false WHERE id = $1", [sessionId])

    console.log("[v0] Sesión revocada exitosamente")
    return NextResponse.json({
      success: true,
      message: "Sesión revocada exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error revocando sesión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
