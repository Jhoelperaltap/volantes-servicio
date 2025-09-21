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
        u.id,
        u.name,
        COUNT(st.id) as total_tickets,
        COUNT(CASE WHEN st.status = 'completado' AND st.requires_return = false THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN st.status = 'pendiente' OR st.requires_return = true THEN 1 END) as pending_tickets,
        COALESCE(AVG(EXTRACT(HOUR FROM (st.completed_at - st.created_at))), 0) as avg_resolution_time,
        CASE 
          WHEN COUNT(st.id) > 0 THEN 
            (COUNT(CASE WHEN st.status = 'completado' AND st.requires_return = false THEN 1 END) * 100.0 / COUNT(st.id))
          ELSE 0 
        END as completion_rate
      FROM users u
      LEFT JOIN service_tickets st ON u.id = st.technician_id
      WHERE u.role = 'tecnico' AND u.is_active = true
      GROUP BY u.id, u.name
      ORDER BY completion_rate DESC, total_tickets DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching technician stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
