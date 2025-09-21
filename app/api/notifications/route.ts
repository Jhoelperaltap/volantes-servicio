import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50

    let whereClause = ""
    let params: any[] = []

    // Los administradores ven todas las notificaciones, los técnicos solo las suyas
    if (userRole === "tecnico") {
      whereClause = "WHERE n.sent_to = $1"
      params = [userId]
    } else if (["admin", "super_admin"].includes(userRole || "")) {
      whereClause = `WHERE n.sent_to IN (
        SELECT id FROM users WHERE role IN ('admin', 'super_admin')
      )`
    }

    const sqlQuery = `SELECT 
        n.*,
        st.ticket_number,
        l.name as location_name,
        u.name as technician_name,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - st.created_at)) as days_pending
      FROM notifications n
      LEFT JOIN service_tickets st ON n.ticket_id = st.id
      LEFT JOIN locations l ON st.location_id = l.id
      LEFT JOIN users u ON st.technician_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${params.length + 1}`

    const result = await query(sqlQuery, [...params, limit])

    if (result.rows.length === 0 && ["admin", "super_admin"].includes(userRole || "")) {
      // Verificar si hay tickets en el sistema
      const ticketsCheck = await query("SELECT COUNT(*) as count FROM service_tickets")
      const ticketCount = Number.parseInt(ticketsCheck.rows[0].count)

      if (ticketCount > 0) {
        // Crear notificaciones de ejemplo para tickets existentes
        const sampleTickets = await query(`
          SELECT st.id, st.ticket_number, st.created_at, u.id as admin_id
          FROM service_tickets st
          CROSS JOIN users u
          WHERE u.role IN ('admin', 'super_admin')
          AND st.status = 'pendiente'
          LIMIT 3
        `)

        for (const ticket of sampleTickets.rows) {
          await query(
            `
            INSERT INTO notifications (ticket_id, sent_to, type, message, is_read, created_at)
            VALUES ($1, $2, 'pending_reminder', 'Volante pendiente de atención', false, NOW())
            ON CONFLICT DO NOTHING
          `,
            [ticket.id, ticket.admin_id],
          )
        }

        // Volver a ejecutar la consulta original
        const retryResult = await query(sqlQuery, [...params, limit])
        return NextResponse.json(retryResult.rows)
      }
    }

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
