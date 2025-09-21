import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    let whereClause = "WHERE st.id = $1"
    const queryParams = [id]

    // Los técnicos solo pueden ver sus propios volantes
    if (userRole === "tecnico") {
      whereClause += " AND st.technician_id = $2"
      queryParams.push(userId)
    }

    const result = await query(
      `SELECT 
        st.*,
        l.name as location_name,
        l.address as location_address,
        l.contact_person as location_contact_person,
        l.contact_phone as location_contact_phone,
        u.name as technician_name,
        u.email as technician_email,
        cs.company_name,
        cs.company_address,
        cs.company_phone,
        cs.company_email,
        cs.logo_url
      FROM service_tickets st
      JOIN locations l ON st.location_id = l.id
      JOIN users u ON st.technician_id = u.id
      CROSS JOIN company_settings cs
      ${whereClause}`,
      queryParams,
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = result.rows[0]

    // Formatear la respuesta para impresión
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
      technician_signature: ticket.technician_signature,
      client_signature: ticket.client_signature,
      technician_signed_at: ticket.technician_signed_at,
      client_signed_at: ticket.client_signed_at,
      completed_at: ticket.completed_at,
      created_at: ticket.created_at,
      location: {
        name: ticket.location_name,
        address: ticket.location_address,
        contact_person: ticket.location_contact_person,
        contact_phone: ticket.location_contact_phone,
      },
      technician: {
        name: ticket.technician_name,
        email: ticket.technician_email,
      },
      company: {
        name: ticket.company_name,
        address: ticket.company_address,
        phone: ticket.company_phone,
        email: ticket.company_email,
        logo_url: ticket.logo_url,
      },
    }

    return NextResponse.json(formattedTicket)
  } catch (error) {
    console.error("Error fetching service ticket for print:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
