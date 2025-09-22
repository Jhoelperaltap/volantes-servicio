import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Complete ticket API called for ID:", id)

    // Verificar que el usuario sea admin o super_admin
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    console.log("[v0] User role:", userRole, "User ID:", userId)

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No tienes permisos para completar volantes" }, { status: 403 })
    }

    let body
    let completion_note = null

    try {
      const text = await request.text()
      if (text.trim()) {
        body = JSON.parse(text)
        completion_note = body.completion_note
      }
    } catch (jsonError) {
      console.log("[v0] No JSON body provided, using null completion_note")
    }

    // Verificar que el volante existe y está en estado pendiente, escalado o seguimiento
    const ticketResult = await query(
      "SELECT id, status, ticket_number, requires_return FROM service_tickets WHERE id = $1",
      [id],
    )

    if (ticketResult.rows.length === 0) {
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = ticketResult.rows[0]

    if (ticket.status === "completado" && !ticket.requires_return) {
      return NextResponse.json({ error: "El volante ya está completado" }, { status: 400 })
    }

    await query(
      `UPDATE service_tickets 
       SET status = 'completado', 
           requires_return = false,
           completion_note = $2,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, completion_note || null],
    )

    // Crear notificación para el técnico
    await query(
      `INSERT INTO notifications (ticket_id, type, message, sent_to)
       SELECT $1, 'ticket_update', 
              'El volante #' || $2 || ' ha sido marcado como completado por un administrador',
              technician_id
       FROM service_tickets 
       WHERE id = $1`,
      [id, ticket.ticket_number],
    )

    console.log("[v0] Ticket completed successfully:", id)

    return NextResponse.json({
      success: true,
      message: "Volante marcado como completado exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error completing ticket:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
