import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT 
        st.id,
        st.ticket_number,
        st.pending_items,
        st.requires_return,
        l.name as location_name,
        u.name as technician_name,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - st.created_at)) as days_pending
      FROM service_tickets st
      JOIN locations l ON st.location_id = l.id
      JOIN users u ON st.technician_id = u.id
      WHERE st.status = 'pendiente' OR st.requires_return = true
      ORDER BY st.created_at ASC
      LIMIT 10
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching pending tickets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
