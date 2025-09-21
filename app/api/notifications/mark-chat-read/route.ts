import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: "ID del otro usuario requerido" }, { status: 400 })
    }

    // Marcar como leídas todas las notificaciones de chat del otro usuario
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE sent_to = $1 
       AND type = 'chat_message' 
       AND is_read = false
       AND ticket_id IN (
         SELECT DISTINCT ticket_id 
         FROM chat_messages 
         WHERE (sender_id = $2 AND recipient_id = $1)
         OR (sender_id = $1 AND recipient_id = $2)
       )`,
      [userId, otherUserId],
    )

    return NextResponse.json({
      success: true,
      markedCount: result.rowCount,
    })
  } catch (error) {
    console.error("Error marking chat notifications as read:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
