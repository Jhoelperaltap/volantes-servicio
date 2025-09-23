import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const {
      companyId,
      clientId,
      locationId,
      equipmentId,
      serviceType,
      description,
      workPerformed,
      partsUsed,
      requiresReturn,
      pendingItems,
      status,
      technicianSignature,
      clientSignature,
      imageUrl,
    } = await request.json()

    if (!locationId || !equipmentId || !serviceType || !description) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 })
    }

    if (!technicianSignature || !clientSignature) {
      return NextResponse.json({ error: "Se requieren ambas firmas" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO service_tickets (
        technician_id, location_id, equipment_id, 
        service_type, description, work_performed, parts_used, status, 
        requires_return, pending_items, technician_signature, client_signature, 
        technician_signed_at, client_signed_at, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, ticket_number`,
      [
        userId,
        locationId,
        equipmentId,
        serviceType,
        description,
        workPerformed || null,
        JSON.stringify(partsUsed || []),
        status || "completado",
        requiresReturn || false,
        pendingItems || null,
        technicianSignature,
        clientSignature,
        new Date().toISOString(),
        new Date().toISOString(),
        imageUrl || null,
      ],
    )

    const ticket = result.rows[0]

    // Si hay items pendientes, crear notificación
    if (status === "pendiente" || requiresReturn) {
      await query(
        `INSERT INTO notifications (ticket_id, type, message, sent_to)
         SELECT $1, 'pending_reminder', $2, id FROM users WHERE role IN ('admin', 'super_admin')`,
        [
          ticket.id,
          `Volante #${ticket.ticket_number} requiere seguimiento: ${pendingItems || "Visita de seguimiento programada"}`,
        ],
      )
    }

    try {
      await fetch(`${request.nextUrl.origin}/api/service-tickets/${ticket.id}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-role": request.headers.get("x-user-role") || "",
        },
        body: JSON.stringify({}),
      })
    } catch (emailError) {
      console.error("Error sending automatic email:", emailError)
      // No fallar la creación del volante si el email falla
    }

    return NextResponse.json({
      success: true,
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
    })
  } catch (error) {
    console.error("Error creating service ticket:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

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
        st.id, st.ticket_number, st.service_type, st.description, st.status,
        st.requires_return, st.completed_at, st.created_at, st.image_url,
        cl.name as location_name, cl.address as location_address, cl.city as location_city,
        e.name as equipment_name, e.model as equipment_model, e.equipment_type,
        u.name as technician_name
      FROM service_tickets st
      JOIN client_locations cl ON st.location_id = cl.id
      LEFT JOIN equipment e ON st.equipment_id = e.id
      JOIN users u ON st.technician_id = u.id
      ${whereClause}
      ORDER BY st.created_at DESC`,
      params,
    )

    const ticketsWithDetails = await Promise.all(
      result.rows.map(async (ticket) => {
        try {
          // Obtener información del cliente a través de client_locations
          const clientResult = await query(
            `SELECT c.name as client_name, c.contact_email as client_email, c.contact_phone as client_phone,
                    co.name as company_name, co.contact_email as company_email, co.contact_phone as company_phone
             FROM client_locations cl
             JOIN clients c ON cl.client_id = c.id
             JOIN companies co ON c.company_id = co.id
             WHERE cl.id = $1`,
            [ticket.location_id],
          )

          const clientInfo = clientResult.rows[0] || {}

          return {
            ...ticket,
            client_name: clientInfo.client_name || "Cliente no encontrado",
            client_email: clientInfo.client_email || "",
            client_phone: clientInfo.client_phone || "",
            company_name: clientInfo.company_name || "Empresa no encontrada",
            company_email: clientInfo.company_email || "",
            company_phone: clientInfo.company_phone || "",
          }
        } catch (error) {
          console.error("Error fetching client details for ticket:", ticket.id, error)
          return {
            ...ticket,
            client_name: "Cliente no encontrado",
            client_email: "",
            client_phone: "",
            company_name: "Empresa no encontrada",
            company_email: "",
            company_phone: "",
          }
        }
      }),
    )

    return NextResponse.json(ticketsWithDetails)
  } catch (error) {
    console.error("Error fetching service tickets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
