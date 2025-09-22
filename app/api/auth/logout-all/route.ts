import { NextResponse, type NextRequest } from "next/server"
import { SessionManager } from "@/lib/session-manager"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const revokedCount = await SessionManager.logoutAllDevices(payload.userId, payload.tokenId)

    return NextResponse.json({
      success: true,
      message: `Se cerraron ${revokedCount} sesiones en otros dispositivos`,
    })
  } catch (error) {
    console.error("Error en logout-all:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
