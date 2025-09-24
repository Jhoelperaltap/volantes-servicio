import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    try {
      const result = await query("SELECT * FROM notification_settings ORDER BY created_at DESC LIMIT 1")

      if (result.rows.length > 0) {
        const settings = result.rows[0]
        return NextResponse.json({
          reminder_hours: settings.reminder_hours,
          escalation_days: settings.escalation_days,
          overdue_days: settings.overdue_days,
          email_notifications: settings.email_notifications,
          auto_escalation: settings.auto_escalation,
          reminder_frequency_hours: settings.reminder_frequency_hours,
        })
      }
    } catch (dbError) {
      // Notification settings table doesn't exist, using defaults
    }

    // Configuración por defecto si no existe la tabla o no hay datos
    const defaultSettings = {
      reminder_hours: 24,
      escalation_days: 3,
      overdue_days: 7,
      email_notifications: true,
      auto_escalation: true,
      reminder_frequency_hours: 12,
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const settings = await request.json()

    if (settings.reminder_hours < 1 || settings.reminder_hours > 72) {
      return NextResponse.json({ error: "Las horas de recordatorio deben estar entre 1 y 72" }, { status: 400 })
    }

    if (settings.escalation_days < 1 || settings.escalation_days > 30) {
      return NextResponse.json({ error: "Los días de escalamiento deben estar entre 1 y 30" }, { status: 400 })
    }

    if (settings.overdue_days < 1 || settings.overdue_days > 60) {
      return NextResponse.json({ error: "Los días de vencimiento deben estar entre 1 y 60" }, { status: 400 })
    }

    try {
      await query(
        `
        INSERT INTO notification_settings (
          reminder_hours, escalation_days, overdue_days, 
          email_notifications, auto_escalation, reminder_frequency_hours,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
        [
          settings.reminder_hours,
          settings.escalation_days,
          settings.overdue_days,
          settings.email_notifications,
          settings.auto_escalation,
          settings.reminder_frequency_hours,
        ],
      )
    } catch (dbError: any) {
      if (dbError.message?.includes('relation "notification_settings" does not exist')) {
        // Create the table and try again
        await query(`
          CREATE TABLE IF NOT EXISTS notification_settings (
            id SERIAL PRIMARY KEY,
            reminder_hours INTEGER NOT NULL DEFAULT 24,
            escalation_days INTEGER NOT NULL DEFAULT 3,
            overdue_days INTEGER NOT NULL DEFAULT 7,
            email_notifications BOOLEAN NOT NULL DEFAULT true,
            auto_escalation BOOLEAN NOT NULL DEFAULT true,
            reminder_frequency_hours INTEGER NOT NULL DEFAULT 12,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `)

        await query(
          `
          INSERT INTO notification_settings (
            reminder_hours, escalation_days, overdue_days, 
            email_notifications, auto_escalation, reminder_frequency_hours,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
          [
            settings.reminder_hours,
            settings.escalation_days,
            settings.overdue_days,
            settings.email_notifications,
            settings.auto_escalation,
            settings.reminder_frequency_hours,
          ],
        )
      } else {
        throw dbError
      }
    }

    return NextResponse.json({ success: true, message: "Configuración guardada exitosamente" })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
