import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    let whereClause = "WHERE st.id = $1"
    const queryParams = [id]

    // Los técnicos solo pueden ver sus propios volantes
    if (userRole === "tecnico") {
      whereClause += " AND st.technician_id = $2"
      queryParams.push(userId)
    }

    const result = await query(`SELECT st.* FROM service_tickets st ${whereClause}`, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = result.rows[0]

    let locationInfo = null
    const clientInfo = null
    let companyInfo = null
    let equipmentInfo = null
    let technicianInfo = null

    // Obtener información de ubicación
    if (ticket.location_id) {
      const locationResult = await query(
        "SELECT cl.*, c.name as client_name, c.company_id FROM client_locations cl LEFT JOIN clients c ON cl.client_id = c.id WHERE cl.id = $1",
        [ticket.location_id],
      )
      if (locationResult.rows.length > 0) {
        locationInfo = locationResult.rows[0]

        // Obtener información de empresa
        if (locationInfo.company_id) {
          const companyResult = await query("SELECT * FROM companies WHERE id = $1", [locationInfo.company_id])
          if (companyResult.rows.length > 0) {
            companyInfo = companyResult.rows[0]
          }
        }
      }
    }

    // Obtener información de equipo
    if (ticket.equipment_id) {
      const equipmentResult = await query("SELECT * FROM equipment WHERE id = $1", [ticket.equipment_id])
      if (equipmentResult.rows.length > 0) {
        equipmentInfo = equipmentResult.rows[0]
      }
    }

    // Obtener información de técnico
    if (ticket.technician_id) {
      const technicianResult = await query("SELECT name, email FROM users WHERE id = $1", [ticket.technician_id])
      if (technicianResult.rows.length > 0) {
        technicianInfo = technicianResult.rows[0]
      }
    }

    // Formatear la respuesta
    const formattedTicket = {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      service_type: ticket.service_type,
      description: ticket.description,
      work_performed: ticket.work_performed,
      parts_used: ticket.parts_used || [],
      status: ticket.status,
      requires_return: ticket.requires_return,
      pending_items: ticket.pending_items,
      completion_note: ticket.completion_note,
      technician_signature: ticket.technician_signature,
      client_signature: ticket.client_signature,
      technician_signed_at: ticket.technician_signed_at,
      client_signed_at: ticket.client_signed_at,
      completed_at: ticket.completed_at,
      created_at: ticket.created_at,
      image_url: ticket.image_url,
      location: locationInfo
        ? {
            name: locationInfo.name,
            address: locationInfo.address,
            city: locationInfo.city,
            contact_person: locationInfo.contact_person,
            contact_phone: locationInfo.contact_phone,
          }
        : null,
      client: locationInfo
        ? {
            name: locationInfo.client_name || "No disponible",
          }
        : null,
      company: companyInfo
        ? {
            name: companyInfo.name,
            contact_email: companyInfo.contact_email,
            contact_phone: companyInfo.contact_phone,
          }
        : null,
      equipment: equipmentInfo
        ? {
            name: equipmentInfo.name,
            model: equipmentInfo.model,
            serial_number: equipmentInfo.serial_number,
            type: equipmentInfo.equipment_type,
          }
        : null,
      technician: technicianInfo
        ? {
            name: technicianInfo.name,
            email: technicianInfo.email,
          }
        : null,
    }

    return NextResponse.json(formattedTicket)
  } catch (error) {
    console.error("[v0] Error fetching service ticket:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
