import { NextResponse, type NextRequest } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const sessions = await sql`
      SELECT 
        s.id,
        s.user_id as "userId",
        s.device_info as "deviceInfo",
        s.ip_address as "ipAddress",
        s.last_activity as "lastActivity",
        s.created_at as "createdAt",
        u.name as "userName"
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > NOW()
      ORDER BY s.last_activity DESC
    `

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        deviceInfo: session.deviceInfo || "Dispositivo desconocido",
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isCurrent: session.userId === Number.parseInt(userId),
      })),
    })
  } catch (error) {
    console.error("Error obteniendo sesiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
