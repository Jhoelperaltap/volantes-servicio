import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT 
        l.id,
        l.name,
        COUNT(st.id) as ticket_count,
        COUNT(CASE WHEN st.status = 'pendiente' OR st.requires_return = true THEN 1 END) as pending_count
      FROM locations l
      LEFT JOIN service_tickets st ON l.id = st.location_id
      WHERE l.is_active = true
      GROUP BY l.id, l.name
      HAVING COUNT(st.id) > 0
      ORDER BY ticket_count DESC, pending_count DESC
      LIMIT 5
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching locations summary:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
