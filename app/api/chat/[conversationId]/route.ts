import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET - Obtener mensajes de una conversación
export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    if (!userRole || !userId || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { conversationId } = await params
    const [user1Id, user2Id] = conversationId.split("-")

    // Verificar que el usuario sea parte de la conversación
    if (userId !== user1Id && userId !== user2Id) {
      return NextResponse.json({ error: "No autorizado para ver esta conversación" }, { status: 403 })
    }

    // Obtener mensajes de la conversación
    const result = await query(
      `
      SELECT 
        cm.id,
        cm.sender_id,
        cm.recipient_id,
        cm.message,
        cm.ticket_id,
        cm.created_at,
        cm.read_at,
        u.name as sender_name,
        u.role as sender_role
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE (cm.sender_id = $1 AND cm.recipient_id = $2) 
         OR (cm.sender_id = $2 AND cm.recipient_id = $1)
      ORDER BY cm.created_at ASC
    `,
      [user1Id, user2Id],
    )

    // Marcar mensajes como leídos
    await query(
      `
      UPDATE chat_messages 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE recipient_id = $1 
        AND ((sender_id = $2 AND recipient_id = $3) OR (sender_id = $3 AND recipient_id = $2))
        AND read_at IS NULL
    `,
      [userId, user1Id, user2Id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
