import { NextResponse } from "next/server"
import { SessionManager } from "@/lib/session-manager"
import type { Request } from "next/dist/server/web/spec-extension/request"

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    await SessionManager.cleanupExpiredSessions()

    return NextResponse.json({
      success: true,
      message: "Limpieza de sesiones completada",
    })
  } catch (error) {
    console.error("Error en limpieza de sesiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
