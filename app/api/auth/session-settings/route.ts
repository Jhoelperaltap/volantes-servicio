import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("[v0] Consultando configuración de sesiones para usuario:", userId)

    const result = await query(
      `SELECT 
        max_sessions,
        session_timeout_hours,
        require_2fa,
        allow_concurrent_sessions
      FROM session_settings 
      WHERE user_id = $1`,
      [userId],
    )

    console.log("[v0] Resultado de consulta session_settings:", result.rows)

    if (result.rows.length > 0) {
      const settings = result.rows[0]
      return NextResponse.json({
        maxConcurrentSessions: settings.max_sessions,
        sessionTimeoutMinutes: settings.session_timeout_hours * 60, // Convertir horas a minutos
        requireDeviceApproval: settings.require_2fa,
        allowConcurrentSessions: settings.allow_concurrent_sessions,
      })
    } else {
      console.log("[v0] Insertando configuración por defecto para usuario:", userId)

      await query(
        `INSERT INTO session_settings (user_id, max_sessions, session_timeout_hours, require_2fa, allow_concurrent_sessions)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, 5, 8, false, true],
      )

      return NextResponse.json({
        maxConcurrentSessions: 5,
        sessionTimeoutMinutes: 480, // 8 horas en minutos
        requireDeviceApproval: false,
        allowConcurrentSessions: true,
      })
    }
  } catch (error) {
    console.error("[v0] Error obteniendo configuración de sesiones:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : "Error desconocido",
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
      detail: error && typeof error === "object" && "detail" in error ? error.detail : undefined,
    })

    return NextResponse.json({
      maxConcurrentSessions: 5,
      sessionTimeoutMinutes: 480,
      requireDeviceApproval: false,
      allowConcurrentSessions: true,
      message: "Usando configuración por defecto - verificar conexión BD",
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const { maxConcurrentSessions, sessionTimeoutMinutes, requireDeviceApproval, allowConcurrentSessions } =
      await request.json()

    if (maxConcurrentSessions < 1 || maxConcurrentSessions > 10) {
      return NextResponse.json({ error: "El máximo de sesiones debe estar entre 1 y 10" }, { status: 400 })
    }

    if (sessionTimeoutMinutes < 60 || sessionTimeoutMinutes > 1440) {
      return NextResponse.json({ error: "El tiempo de sesión debe estar entre 60 y 1440 minutos" }, { status: 400 })
    }

    await query(
      `INSERT INTO session_settings (user_id, max_sessions, session_timeout_hours, require_2fa, allow_concurrent_sessions)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         max_sessions = EXCLUDED.max_sessions,
         session_timeout_hours = EXCLUDED.session_timeout_hours,
         require_2fa = EXCLUDED.require_2fa,
         allow_concurrent_sessions = EXCLUDED.allow_concurrent_sessions,
         updated_at = NOW()`,
      [
        userId,
        maxConcurrentSessions,
        Math.round(sessionTimeoutMinutes / 60),
        requireDeviceApproval,
        allowConcurrentSessions,
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Configuración actualizada correctamente",
    })
  } catch (error) {
    console.error("Error actualizando configuración de sesiones:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
