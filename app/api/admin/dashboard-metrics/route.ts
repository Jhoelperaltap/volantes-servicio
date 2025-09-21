import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Tasa de completado
    const completionResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completado' THEN 1 END) as completed
      FROM service_tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)

    const total = Number.parseInt(completionResult.rows[0].total)
    const completed = Number.parseInt(completionResult.rows[0].completed)
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Tiempo promedio de resolución (simulado por ahora)
    const avgResolutionTime = 4.2

    // Distribución por estado
    const statusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) as percentage
      FROM service_tickets
      GROUP BY status
      ORDER BY count DESC
    `)

    // Distribución por tipo de servicio
    const typeResult = await query(`
      SELECT 
        service_type as type,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) as percentage
      FROM service_tickets
      GROUP BY service_type
      ORDER BY count DESC
    `)

    // Tendencia semanal
    const weeklyResult = await query(`
      SELECT 
        TO_CHAR(date_series, 'Day') as day,
        COALESCE(created_count, 0) as tickets,
        COALESCE(completed_count, 0) as completed
      FROM (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        ) as date_series
      ) dates
      LEFT JOIN (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as created_count
        FROM service_tickets
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
      ) created ON DATE(dates.date_series) = created.date
      LEFT JOIN (
        SELECT 
          DATE(updated_at) as date,
          COUNT(*) as completed_count
        FROM service_tickets
        WHERE status = 'completado' 
        AND updated_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(updated_at)
      ) completed_tickets ON DATE(dates.date_series) = completed_tickets.date
      ORDER BY dates.date_series
    `)

    // Estadísticas de técnicos
    const technicianResult = await query(`
      SELECT 
        u.name,
        COUNT(st.id) as total_tickets,
        COUNT(CASE WHEN st.status = 'completado' THEN 1 END) as completed,
        COUNT(CASE WHEN st.status = 'pendiente' OR st.requires_return = true THEN 1 END) as pending,
        CASE 
          WHEN COUNT(st.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN st.status = 'completado' THEN 1 END) * 100.0 / COUNT(st.id)), 0)
          ELSE 0 
        END as efficiency
      FROM users u
      LEFT JOIN service_tickets st ON u.id = st.technician_id
      WHERE u.role = 'tecnico' AND u.is_active = true
      GROUP BY u.id, u.name
      HAVING COUNT(st.id) > 0
      ORDER BY efficiency DESC, completed DESC
      LIMIT 10
    `)

    const metrics = {
      completionRate,
      avgResolutionTime,
      ticketsByStatus: statusResult.rows.map((row) => ({
        status: row.status,
        count: Number.parseInt(row.count),
        percentage: Number.parseFloat(row.percentage),
      })),
      ticketsByType: typeResult.rows.map((row) => ({
        type: row.type,
        count: Number.parseInt(row.count),
        percentage: Number.parseFloat(row.percentage),
      })),
      weeklyTrend: weeklyResult.rows.map((row) => ({
        day: row.day.trim().substring(0, 3), // Lun, Mar, etc.
        tickets: Number.parseInt(row.tickets),
        completed: Number.parseInt(row.completed),
      })),
      technicianStats: technicianResult.rows.map((row) => ({
        name: row.name,
        completed: Number.parseInt(row.completed),
        pending: Number.parseInt(row.pending),
        efficiency: Number.parseInt(row.efficiency),
      })),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
