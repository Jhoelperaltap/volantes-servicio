import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Advanced stats endpoint - Starting")

    const userRole = request.headers.get("x-user-role")
    console.log("[v0] Advanced stats endpoint - User role:", userRole)

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      console.log("[v0] Advanced stats endpoint - Unauthorized")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    console.log("[v0] Advanced stats endpoint - Getting service type stats")
    const serviceTypeStats = await query(`
      SELECT 
        COALESCE(st.service_type, 'No especificado') as service_type,
        COUNT(st.id) as total_services,
        COUNT(CASE WHEN st.status = 'completado' THEN 1 END) as completed_count,
        COUNT(CASE WHEN st.status = 'pendiente' THEN 1 END) as pending_count
      FROM service_tickets st
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY st.service_type
      ORDER BY total_services DESC
      LIMIT 10
    `)

    console.log("[v0] Advanced stats endpoint - Getting location visits")
    const locationVisits = await query(`
      SELECT 
        COALESCE(l.name, 'Sin nombre') as location_name,
        COALESCE(l.contact_person, 'Sin contacto') as contact_person,
        COUNT(st.id) as total_visits,
        COUNT(CASE WHEN st.status = 'completado' THEN 1 END) as completed_visits
      FROM locations l
      LEFT JOIN service_tickets st ON l.id = st.location_id
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY l.id, l.name, l.contact_person
      HAVING COUNT(st.id) > 0
      ORDER BY total_visits DESC
      LIMIT 10
    `)

    console.log("[v0] Advanced stats endpoint - Getting pending locations")
    const locationsPending = await query(`
      SELECT 
        COALESCE(l.name, 'Sin nombre') as location_name,
        COALESCE(l.contact_person, 'Sin contacto') as contact_person,
        COUNT(st.id) as pending_count
      FROM locations l
      LEFT JOIN service_tickets st ON l.id = st.location_id
      WHERE st.status IN ('pendiente', 'escalado') OR st.requires_return = true
      GROUP BY l.id, l.name, l.contact_person
      HAVING COUNT(st.id) > 0
      ORDER BY pending_count DESC
      LIMIT 10
    `)

    console.log("[v0] Advanced stats endpoint - Getting parts usage")
    const partsUsage = await query(`
      SELECT 
        part_data->>'name' as part_name,
        part_data->>'part_number' as part_number,
        COUNT(*) as usage_count,
        SUM(COALESCE((part_data->>'quantity')::integer, 1)) as total_quantity_used
      FROM service_tickets st,
      LATERAL jsonb_array_elements(COALESCE(st.parts_used, '[]'::jsonb)) as part_data
      WHERE st.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND jsonb_array_length(COALESCE(st.parts_used, '[]'::jsonb)) > 0
      GROUP BY part_data->>'name', part_data->>'part_number'
      HAVING COUNT(*) > 0
      ORDER BY usage_count DESC
      LIMIT 10
    `)

    console.log("[v0] Advanced stats endpoint - Getting technician performance")
    const technicianStats = await query(`
      SELECT 
        u.name as technician_name,
        COUNT(st.id) as total_tickets,
        COUNT(CASE WHEN st.status = 'completado' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN st.status = 'pendiente' OR st.requires_return = true THEN 1 END) as pending_tickets
      FROM users u
      LEFT JOIN service_tickets st ON u.id = st.technician_id
      WHERE u.role = 'tecnico' 
      AND st.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.name
      HAVING COUNT(st.id) > 0
      ORDER BY total_tickets DESC
      LIMIT 10
    `)

    const response = {
      serviceTypeStats: serviceTypeStats.rows.map((row) => ({
        serviceType: row.service_type,
        totalServices: Number.parseInt(row.total_services) || 0,
        completedCount: Number.parseInt(row.completed_count) || 0,
        pendingCount: Number.parseInt(row.pending_count) || 0,
      })),
      locationVisits: locationVisits.rows.map((row) => ({
        locationName: row.location_name,
        contactPerson: row.contact_person,
        totalVisits: Number.parseInt(row.total_visits) || 0,
        completedVisits: Number.parseInt(row.completed_visits) || 0,
      })),
      locationsPending: locationsPending.rows.map((row) => ({
        locationName: row.location_name,
        contactPerson: row.contact_person,
        pendingCount: Number.parseInt(row.pending_count) || 0,
      })),
      partsUsage: partsUsage.rows.map((row) => ({
        partName: row.part_name || "Sin nombre",
        partNumber: row.part_number || "N/A",
        usageCount: Number.parseInt(row.usage_count) || 0,
        totalQuantityUsed: Number.parseInt(row.total_quantity_used) || 0,
      })),
      technicianStats: technicianStats.rows.map((row) => ({
        technicianName: row.technician_name,
        totalTickets: Number.parseInt(row.total_tickets) || 0,
        completedTickets: Number.parseInt(row.completed_tickets) || 0,
        pendingTickets: Number.parseInt(row.pending_tickets) || 0,
      })),
    }

    console.log("[v0] Advanced stats endpoint - Success, returning data")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Advanced stats endpoint - Error:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
