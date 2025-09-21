import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET - Obtener lista de técnicos para iniciar chat (solo admin/super_admin)
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    if (!userRole || !userId || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener lista de técnicos
    const result = await query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        CASE 
          WHEN cm.last_message_at IS NOT NULL THEN cm.last_message_at
          ELSE NULL
        END as last_chat_at
      FROM users u
      LEFT JOIN (
        SELECT 
          CASE 
            WHEN sender_id = $1 THEN recipient_id
            WHEN recipient_id = $1 THEN sender_id
          END as other_user_id,
          MAX(created_at) as last_message_at
        FROM chat_messages
        WHERE sender_id = $1 OR recipient_id = $1
        GROUP BY other_user_id
      ) cm ON cm.other_user_id = u.id
      WHERE u.role = 'tecnico' AND u.id != $1
      ORDER BY cm.last_message_at DESC NULLS LAST, u.name ASC
    `,
      [userId],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching technicians:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
