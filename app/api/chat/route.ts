import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    if (!userRole || !userId || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
    }

    // Obtener conversaciones del usuario
    const result = await query(
      `
      SELECT 
        conversation_id,
        CASE 
          WHEN user1_id = $1 THEN user2_id
          ELSE user1_id
        END as other_user_id,
        CASE 
          WHEN user1_id = $1 THEN user2_name
          ELSE user1_name
        END as other_user_name,
        CASE 
          WHEN user1_id = $1 THEN user2_role
          ELSE user1_role
        END as other_user_role,
        last_message,
        last_message_at,
        last_sender_id,
        unread_count
      FROM chat_conversations
      WHERE user1_id = $1 OR user2_id = $1
      ORDER BY last_message_at DESC
    `,
      [userId],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching chat conversations:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    if (!userRole || !userId || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
    }

    const { recipientId, message, ticketId } = await request.json()

    if (!recipientId || !message) {
      return NextResponse.json({ error: "Datos requeridos faltantes" }, { status: 400 })
    }

    if (!isValidUUID(recipientId)) {
      return NextResponse.json({ error: "ID de destinatario inválido" }, { status: 400 })
    }

    if (ticketId && !isValidUUID(ticketId)) {
      return NextResponse.json({ error: "ID de ticket inválido" }, { status: 400 })
    }

    // Verificar que el usuario tenga permisos para chatear con el destinatario
    const recipientResult = await query("SELECT role FROM users WHERE id = $1", [recipientId])

    if (recipientResult.rows.length === 0) {
      return NextResponse.json({ error: "Usuario destinatario no encontrado" }, { status: 404 })
    }

    const recipientRole = recipientResult.rows[0].role

    // Solo admin/super_admin pueden iniciar chats con técnicos
    if (userRole === "tecnico" && !["admin", "super_admin"].includes(recipientRole)) {
      return NextResponse.json({ error: "Los técnicos solo pueden responder a administradores" }, { status: 403 })
    }

    // Verificar si ya existe una conversación entre estos usuarios
    const existingConversation = await query(
      `
      SELECT id FROM chat_messages 
      WHERE (sender_id = $1 AND recipient_id = $2) 
         OR (sender_id = $2 AND recipient_id = $1)
      LIMIT 1
    `,
      [userId, recipientId],
    )

    // Insertar el mensaje
    const result = await query(
      `
      INSERT INTO chat_messages (sender_id, recipient_id, message, ticket_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `,
      [userId, recipientId, message, ticketId || null],
    )

    return NextResponse.json({
      id: result.rows[0].id,
      senderId: userId,
      recipientId,
      message,
      ticketId,
      createdAt: result.rows[0].created_at,
    })
  } catch (error) {
    console.error("Error sending chat message:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
