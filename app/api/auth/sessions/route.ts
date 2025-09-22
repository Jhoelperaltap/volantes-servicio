import { NextResponse, type NextRequest } from "next/server"
import { SessionManager } from "@/lib/session-manager"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const sessions = await SessionManager.getUserActiveSessions(userId)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error obteniendo sesiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
