import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let whereClause = ""
    let params: any[] = []

    // Los técnicos solo ven sus propios volantes
    if (userRole === "tecnico") {
      whereClause = "WHERE st.technician_id = $1"
      params = [userId]
    }

    const result = await query(
      `SELECT 
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
      LIMIT 10`,
      params,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching recent tickets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
