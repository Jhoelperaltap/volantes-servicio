import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Complete ticket API called for ID:", params.id)

    // Verificar que el usuario sea admin o super_admin
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    console.log("[v0] User role:", userRole, "User ID:", userId)

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No tienes permisos para completar volantes" }, { status: 403 })
    }

    // Verificar que el volante existe y está en estado pendiente o escalado
    const ticketResult = await query("SELECT id, status, ticket_number FROM service_tickets WHERE id = $1", [params.id])

    if (ticketResult.rows.length === 0) {
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = ticketResult.rows[0]

    if (ticket.status === "completado") {
      return NextResponse.json({ error: "El volante ya está completado" }, { status: 400 })
    }

    // Actualizar el estado del volante a completado
    await query(
      `UPDATE service_tickets 
       SET status = 'completado', 
           requires_return = false,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [params.id],
    )

    // Crear notificación para el técnico
    await query(
      `INSERT INTO notifications (ticket_id, type, message, sent_to)
       SELECT $1, 'ticket_update', 
              'El volante #' || $2 || ' ha sido marcado como completado por un administrador',
              technician_id
       FROM service_tickets 
       WHERE id = $1`,
      [params.id, ticket.ticket_number],
    )

    console.log("[v0] Ticket completed successfully:", params.id)

    return NextResponse.json({
      success: true,
      message: "Volante marcado como completado exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error completing ticket:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
