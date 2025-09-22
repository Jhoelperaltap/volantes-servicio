import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const settings = await sql`
      SELECT 
        max_concurrent_sessions as "maxConcurrentSessions",
        session_timeout_minutes as "sessionTimeoutMinutes",
        require_device_approval as "requireDeviceApproval"
      FROM user_session_settings 
      WHERE user_id = ${userId}
    `

    if (settings.length === 0) {
      await sql`
        INSERT INTO user_session_settings (user_id, max_concurrent_sessions, session_timeout_minutes, require_device_approval)
        VALUES (${userId}, 5, 480, false)
      `

      return NextResponse.json({
        maxConcurrentSessions: 5,
        sessionTimeoutMinutes: 480,
        requireDeviceApproval: false,
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Error obteniendo configuración de sesiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const { maxConcurrentSessions, sessionTimeoutMinutes, requireDeviceApproval } = await request.json()

    if (maxConcurrentSessions < 1 || maxConcurrentSessions > 10) {
      return NextResponse.json({ error: "El máximo de sesiones debe estar entre 1 y 10" }, { status: 400 })
    }

    if (sessionTimeoutMinutes < 60 || sessionTimeoutMinutes > 1440) {
      return NextResponse.json({ error: "El tiempo de sesión debe estar entre 60 y 1440 minutos" }, { status: 400 })
    }

    await sql`
      UPDATE user_session_settings 
      SET 
        max_concurrent_sessions = ${maxConcurrentSessions},
        session_timeout_minutes = ${sessionTimeoutMinutes},
        require_device_approval = ${requireDeviceApproval}
      WHERE user_id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "Configuración de sesiones actualizada correctamente",
    })
  } catch (error) {
    console.error("Error actualizando configuración de sesiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
