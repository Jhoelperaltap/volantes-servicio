import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parámetros de búsqueda
    const q = searchParams.get("q") || ""
    const status = searchParams.getAll("status")
    const serviceType = searchParams.getAll("serviceType")
    const companyId = searchParams.get("companyId") || ""
    const clientId = searchParams.get("clientId") || ""
    const locationId = searchParams.get("locationId") || ""
    const equipmentType = searchParams.get("equipmentType") || ""
    const technicianId = searchParams.get("technicianId") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""
    const ticketNumber = searchParams.get("ticketNumber") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Construir la consulta base
    const baseQuery = `
      SELECT 
        st.id, st.ticket_number, st.service_type, st.description, st.status,
        st.requires_return, st.completed_at, st.created_at, st.image_url,
        st.work_performed, st.pending_items,
        cl.name as location_name, cl.address as location_address, cl.city as location_city,
        c.name as client_name, c.contact_email as client_email, c.contact_phone as client_phone,
        co.name as company_name, co.contact_email as company_email, co.contact_phone as company_phone,
        e.name as equipment_name, e.model as equipment_model, e.equipment_type, e.serial_number as equipment_serial,
        u.name as technician_name
      FROM service_tickets st
      JOIN client_locations cl ON st.location_id = cl.id
      JOIN clients c ON cl.client_id = c.id
      JOIN companies co ON c.company_id = co.id
      LEFT JOIN equipment e ON st.equipment_id = e.id
      JOIN users u ON st.technician_id = u.id
    `

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Filtro por rol (técnicos solo ven sus volantes)
    if (userRole === "tecnico") {
      conditions.push(`st.technician_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    // Búsqueda de texto general
    if (q.trim()) {
      conditions.push(`(
        st.description ILIKE $${paramIndex} OR
        st.work_performed ILIKE $${paramIndex} OR
        st.pending_items ILIKE $${paramIndex} OR
        cl.name ILIKE $${paramIndex} OR
        cl.address ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex} OR
        co.name ILIKE $${paramIndex} OR
        e.name ILIKE $${paramIndex} OR
        e.model ILIKE $${paramIndex} OR
        e.serial_number ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex}
      )`)
      params.push(`%${q.trim()}%`)
      paramIndex++
    }

    // Filtro por número de volante
    if (ticketNumber.trim()) {
      if (ticketNumber.includes("-")) {
        // Rango de números (ej: "100-200")
        const [start, end] = ticketNumber.split("-").map((n) => Number.parseInt(n.trim()))
        if (!isNaN(start) && !isNaN(end)) {
          conditions.push(`st.ticket_number BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
          params.push(start, end)
          paramIndex += 2
        }
      } else {
        // Número específico o búsqueda parcial
        const num = Number.parseInt(ticketNumber.trim())
        if (!isNaN(num)) {
          conditions.push(`st.ticket_number = $${paramIndex}`)
          params.push(num)
          paramIndex++
        } else {
          conditions.push(`st.ticket_number::text ILIKE $${paramIndex}`)
          params.push(`%${ticketNumber.trim()}%`)
          paramIndex++
        }
      }
    }

    // Filtros por estado
    if (status.length > 0) {
      const statusConditions = status.map(() => `$${paramIndex++}`).join(", ")
      conditions.push(`st.status IN (${statusConditions})`)
      params.push(...status)
    }

    // Filtros por tipo de servicio
    if (serviceType.length > 0) {
      const serviceConditions = serviceType.map(() => `$${paramIndex++}`).join(", ")
      conditions.push(`st.service_type IN (${serviceConditions})`)
      params.push(...serviceType)
    }

    // Filtro por empresa
    if (companyId) {
      conditions.push(`co.id = $${paramIndex}`)
      params.push(companyId)
      paramIndex++
    }

    // Filtro por cliente
    if (clientId) {
      conditions.push(`c.id = $${paramIndex}`)
      params.push(clientId)
      paramIndex++
    }

    // Filtro por localidad
    if (locationId) {
      conditions.push(`cl.id = $${paramIndex}`)
      params.push(locationId)
      paramIndex++
    }

    // Filtro por tipo de equipo
    if (equipmentType) {
      conditions.push(`e.equipment_type = $${paramIndex}`)
      params.push(equipmentType)
      paramIndex++
    }

    // Filtro por técnico
    if (technicianId) {
      conditions.push(`st.technician_id = $${paramIndex}`)
      params.push(technicianId)
      paramIndex++
    }

    // Filtros por fecha
    if (dateFrom) {
      conditions.push(`st.created_at >= $${paramIndex}`)
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      conditions.push(`st.created_at <= $${paramIndex}`)
      params.push(dateTo + " 23:59:59")
      paramIndex++
    }

    // Construir WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Validar campo de ordenamiento
    const validSortFields = [
      "created_at",
      "ticket_number",
      "status",
      "service_type",
      "company_name",
      "client_name",
      "location_name",
    ]
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : "created_at"
    const validSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

    // Consulta para contar total de resultados
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_tickets st
      JOIN client_locations cl ON st.location_id = cl.id
      JOIN clients c ON cl.client_id = c.id
      JOIN companies co ON c.company_id = co.id
      LEFT JOIN equipment e ON st.equipment_id = e.id
      JOIN users u ON st.technician_id = u.id
      ${whereClause}
    `

    const countResult = await query(countQuery, params)
    const total = Number.parseInt(countResult.rows[0].total)

    // Consulta principal con paginación
    const offset = (page - 1) * limit
    const mainQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY ${
        validSortBy === "company_name"
          ? "co.name"
          : validSortBy === "client_name"
            ? "c.name"
            : validSortBy === "location_name"
              ? "cl.name"
              : `st.${validSortBy}`
      } ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const result = await query(mainQuery, params)

    return NextResponse.json({
      tickets: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        q,
        status,
        serviceType,
        companyId,
        clientId,
        locationId,
        equipmentType,
        technicianId,
        dateFrom,
        dateTo,
        ticketNumber,
      },
    })
  } catch (error) {
    console.error("Error searching service tickets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
