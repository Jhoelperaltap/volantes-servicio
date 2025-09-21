import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Volantes creados hoy
    const ticketsTodayResult = await query(
      `SELECT COUNT(*) as count 
       FROM service_tickets 
       WHERE DATE(created_at) = CURRENT_DATE`,
      [],
    )

    // Técnicos activos
    const activeTechniciansResult = await query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE role IN ('tecnico', 'super_admin') AND is_active = true`,
      [],
    )

    // Total de localidades
    const locationsResult = await query(`SELECT COUNT(*) as count FROM locations`, [])

    // Volantes pendientes
    const pendingTicketsResult = await query(
      `SELECT COUNT(*) as count 
       FROM service_tickets 
       WHERE status IN ('pendiente', 'escalado')`,
      [],
    )

    const stats = {
      ticketsToday: Number.parseInt(ticketsTodayResult.rows[0].count),
      activeTechnicians: Number.parseInt(activeTechniciansResult.rows[0].count),
      totalLocations: Number.parseInt(locationsResult.rows[0].count),
      pendingTickets: Number.parseInt(pendingTicketsResult.rows[0].count),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
