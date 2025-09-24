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

    // Total de volantes
    const totalTicketsResult = await query(`SELECT COUNT(*) as count FROM service_tickets ${whereClause}`, params)
    const totalTickets = Number.parseInt(totalTicketsResult.rows[0].count)

    // Volantes de hoy
    const todayTicketsResult = await query(
      `
      SELECT COUNT(*) as count 
      FROM service_tickets 
      ${whereClause ? whereClause + " AND" : "WHERE"} DATE(created_at) = CURRENT_DATE
    `,
      params,
    )
    const todayTickets = Number.parseInt(todayTicketsResult.rows[0].count)

    // Volantes completados este mes
    const completedTicketsResult = await query(
      `
      SELECT COUNT(*) as count 
      FROM service_tickets 
      ${whereClause ? whereClause + " AND" : "WHERE"} status = 'completado' 
      AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)
    `,
      params,
    )
    const completedTickets = Number.parseInt(completedTicketsResult.rows[0].count)

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

    // Tiempo promedio de resolución simulado
    const avgResolutionTime = 4.2

    return NextResponse.json({
      totalTickets,
      todayTickets,
      completedTickets,
      pendingTickets,
      activeTechnicians,
      avgResolutionTime,
    })
  } catch (error: any) {
    console.error("[v0] Stats endpoint - Error:", error.message, error.stack)
    return NextResponse.json({ error: "Error interno del servidor" }, { status:
  500 })
  }
}