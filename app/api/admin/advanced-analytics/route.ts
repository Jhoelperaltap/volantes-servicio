import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Advanced stats endpoint called")
    const userRole = request.headers.get("x-user-role")
    console.log("[v0] User role:", userRole)

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    console.log("[v0] Starting equipment stats query...")
    const equipmentStatsResult = await query(`
      SELECT 
        e.type as equipment_type,
        e.brand,
        e.model,
        COUNT(st.id) as total_services,
        COUNT(CASE WHEN st.service_type = 'mantenimiento' THEN 1 END) as maintenance_count,
        COUNT(CASE WHEN st.service_type = 'reparacion' THEN 1 END) as repair_count,
        COUNT(CASE WHEN st.service_type = 'instalacion' THEN 1 END) as installation_count,
        COUNT(CASE WHEN st.service_type = 'revision' THEN 1 END) as inspection_count
      FROM equipment e
      LEFT JOIN service_tickets st ON e.id = st.equipment_id
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY e.id, e.type, e.brand, e.model
      HAVING COUNT(st.id) > 0
      ORDER BY total_services DESC
      LIMIT 10
    `)

    console.log("[v0] Starting location visits query...")
    const locationVisitsResult = await query(`
      SELECT 
        l.name as location_name,
        c.name as client_name,
        co.name as company_name,
        COUNT(st.id) as total_visits,
        COUNT(CASE WHEN st.status = 'completado' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN st.status = 'pendiente' OR st.requires_return = true THEN 1 END) as pending_visits,
        ROUND(AVG(EXTRACT(EPOCH FROM (st.updated_at - st.created_at))/3600), 1) as avg_resolution_hours
      FROM locations l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN service_tickets st ON l.id = st.location_id
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY l.id, l.name, c.name, co.name
      HAVING COUNT(st.id) > 0
      ORDER BY total_visits DESC
      LIMIT 15
    `)

    console.log("[v0] Starting location pending query...")
    const locationPendingResult = await query(`
      SELECT 
        l.name as location_name,
        c.name as client_name,
        co.name as company_name,
        COUNT(st.id) as pending_count,
        COUNT(CASE WHEN st.requires_return = true THEN 1 END) as return_required,
        COUNT(CASE WHEN st.status = 'escalado' THEN 1 END) as escalated_count,
        MAX(st.created_at) as last_pending_date
      FROM locations l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN service_tickets st ON l.id = st.location_id
      WHERE (st.status = 'pendiente' OR st.requires_return = true)
      GROUP BY l.id, l.name, c.name, co.name
      HAVING COUNT(st.id) > 0
      ORDER BY pending_count DESC, last_pending_date ASC
      LIMIT 10
    `)

    console.log("[v0] Starting parts usage query...")
    const partsUsageResult = await query(`
      SELECT 
        p.name as part_name,
        p.part_number,
        p.category,
        p.brand,
        COUNT(stp.id) as usage_count,
        SUM(stp.quantity) as total_quantity_used,
        AVG(stp.quantity) as avg_quantity_per_service,
        SUM(stp.quantity * p.unit_cost) as total_cost,
        COUNT(DISTINCT st.location_id) as locations_used,
        COUNT(DISTINCT st.technician_id) as technicians_used
      FROM parts p
      LEFT JOIN service_ticket_parts stp ON p.id = stp.part_id
      LEFT JOIN service_tickets st ON stp.service_ticket_id = st.id
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY p.id, p.name, p.part_number, p.category, p.brand
      HAVING COUNT(stp.id) > 0
      ORDER BY usage_count DESC, total_quantity_used DESC
      LIMIT 15
    `)

    console.log("[v0] Starting service types trend query...")
    const serviceTypesTrendResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        service_type,
        COUNT(*) as count
      FROM service_tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM'), service_type
      ORDER BY month DESC, count DESC
    `)

    console.log("[v0] All queries completed, formatting response...")
    const advancedStats = {
      equipmentStats: equipmentStatsResult.rows.map((row) => ({
        equipmentType: row.equipment_type || "No especificado",
        brand: row.brand || "No especificado",
        model: row.model || "No especificado",
        totalServices: Number.parseInt(row.total_services),
        maintenanceCount: Number.parseInt(row.maintenance_count),
        repairCount: Number.parseInt(row.repair_count),
        installationCount: Number.parseInt(row.installation_count),
        inspectionCount: Number.parseInt(row.inspection_count),
      })),
      locationVisits: locationVisitsResult.rows.map((row) => ({
        locationName: row.location_name,
        clientName: row.client_name || "No especificado",
        companyName: row.company_name || "No especificado",
        totalVisits: Number.parseInt(row.total_visits),
        completedVisits: Number.parseInt(row.completed_visits),
        pendingVisits: Number.parseInt(row.pending_visits),
        avgResolutionHours: Number.parseFloat(row.avg_resolution_hours) || 0,
      })),
      locationsPending: locationPendingResult.rows.map((row) => ({
        locationName: row.location_name,
        clientName: row.client_name || "No especificado",
        companyName: row.company_name || "No especificado",
        pendingCount: Number.parseInt(row.pending_count),
        returnRequired: Number.parseInt(row.return_required),
        escalatedCount: Number.parseInt(row.escalated_count),
        lastPendingDate: row.last_pending_date,
      })),
      partsUsage: partsUsageResult.rows.map((row) => ({
        partName: row.part_name,
        partNumber: row.part_number || "N/A",
        category: row.category || "General",
        brand: row.brand || "No especificado",
        usageCount: Number.parseInt(row.usage_count),
        totalQuantityUsed: Number.parseInt(row.total_quantity_used),
        avgQuantityPerService: Number.parseFloat(row.avg_quantity_per_service) || 0,
        totalCost: Number.parseFloat(row.total_cost) || 0,
        locationsUsed: Number.parseInt(row.locations_used),
        techniciansUsed: Number.parseInt(row.technicians_used),
      })),
      serviceTypesTrend: serviceTypesTrendResult.rows.map((row) => ({
        month: row.month,
        serviceType: row.service_type,
        count: Number.parseInt(row.count),
      })),
    }

    console.log("[v0] Response formatted successfully, returning data")
    return NextResponse.json(advancedStats)
  } catch (error) {
    console.error("[v0] Error fetching advanced stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
