import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")
    const userId = request.headers.get("x-user-id")

    if (!userRole || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let whereClause = ""
    let params: any[] = []

    if (userRole === "tecnico" && userId) {
      whereClause = "WHERE st.technician_id = $1"
      params = [userId]
    }

    const result = await query(
      `
      SELECT 
        st.id,
        st.ticket_number,
        st.service_type,
        st.status,
        st.created_at,
        l.name as location_name,
        u.name as technician_name
      FROM service_tickets st
      JOIN locations l ON st.location_id = l.id
      JOIN users u ON st.technician_id = u.id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT 10
    `,
      params,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
