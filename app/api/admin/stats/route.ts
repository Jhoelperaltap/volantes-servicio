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
      whereClause = "WHERE technician_id = $1"
      params = [userId]
    }

    // Volantes de hoy
    const todayTicketsResult = await query(
      `
      SELECT COUNT(*) as count 
      FROM service_tickets 
      ${whereClause ? whereClause + " AND" : "WHERE"} DATE(created_at) = CURRENT_DATE
    `,
      params,
    )
    const ticketsToday = Number.parseInt(todayTicketsResult.rows[0].count)

    // Volantes pendientes
    const pendingTicketsResult = await query(
      `
      SELECT COUNT(*) as count 
      FROM service_tickets 
      ${whereClause ? whereClause + " AND" : "WHERE"} (status = 'pendiente' OR requires_return = true)
    `,
      params,
    )
    const pendingTickets = Number.parseInt(pendingTicketsResult.rows[0].count)

    // Técnicos activos (solo para admin/super_admin)
    let activeTechnicians = 0
    if (userRole !== "tecnico") {
      const activeTechniciansResult = await query(`
        SELECT COUNT(DISTINCT technician_id) as count 
        FROM service_tickets 
        WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
      `)
      activeTechnicians = Number.parseInt(activeTechniciansResult.rows[0].count)
    }

    // Total de localidades
    const totalLocationsResult = await query("SELECT COUNT(*) as count FROM locations")
    const totalLocations = Number.parseInt(totalLocationsResult.rows[0].count)

    return NextResponse.json({
      ticketsToday,
      activeTechnicians,
      totalLocations,
      pendingTickets,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
