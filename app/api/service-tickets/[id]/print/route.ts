import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Print endpoint - Starting request")

    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      console.log("[v0] Print endpoint - No user ID")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params
    console.log("[v0] Print endpoint - Ticket ID:", id)

    // Primero obtener el volante básico
    let whereClause = "WHERE id = $1"
    const queryParams = [id]

    // Los técnicos solo pueden ver sus propios volantes
    if (userRole === "tecnico") {
      whereClause += " AND technician_id = $2"
      queryParams.push(userId)
    }

    const ticketResult = await query(`SELECT * FROM service_tickets ${whereClause}`, queryParams)

    console.log("[v0] Print endpoint - Ticket query result:", ticketResult.rows.length)

    if (ticketResult.rows.length === 0) {
      console.log("[v0] Print endpoint - Ticket not found")
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = ticketResult.rows[0]

    // Obtener información relacionada
    let location = null
    let technician = null
    let company = null
    let equipment = null

    try {
      // Obtener ubicación
      if (ticket.location_id) {
        const locationResult = await query("SELECT * FROM client_locations WHERE id = $1", [ticket.location_id])
        if (locationResult.rows.length > 0) {
          location = {
            name: locationResult.rows[0].name,
            address: locationResult.rows[0].address,
            contact_person: locationResult.rows[0].contact_person,
            contact_phone: locationResult.rows[0].contact_phone,
          }

          // Obtener empresa a través de client_locations
          if (locationResult.rows[0].company_id) {
            const companyResult = await query("SELECT * FROM companies WHERE id = $1", [
              locationResult.rows[0].company_id,
            ])
            if (companyResult.rows.length > 0) {
              company = {
                name: companyResult.rows[0].name,
                address: companyResult.rows[0].address,
                phone: companyResult.rows[0].phone,
                email: companyResult.rows[0].contact_email,
                logo_url: companyResult.rows[0].logo_url,
              }
            }
          }
        }
      }

      // Obtener técnico
      if (ticket.technician_id) {
        const technicianResult = await query("SELECT name, email FROM users WHERE id = $1", [ticket.technician_id])
        if (technicianResult.rows.length > 0) {
          technician = {
            name: technicianResult.rows[0].name,
            email: technicianResult.rows[0].email,
          }
        }
      }

      // Obtener equipo
      if (ticket.equipment_id) {
        console.log("[v0] Print endpoint - Equipment ID found:", ticket.equipment_id)
        const equipmentResult = await query("SELECT * FROM equipment WHERE id = $1", [ticket.equipment_id])
        console.log("[v0] Print endpoint - Equipment query result:", equipmentResult.rows.length)
        if (equipmentResult.rows.length > 0) {
          console.log("[v0] Print endpoint - Equipment data:", equipmentResult.rows[0])
          equipment = {
            type: equipmentResult.rows[0].type,
            brand: equipmentResult.rows[0].brand,
            model: equipmentResult.rows[0].model,
            serial_number: equipmentResult.rows[0].serial_number,
          }
        }
      } else {
        console.log("[v0] Print endpoint - No equipment_id found in ticket")
      }

      // Obtener configuración de empresa por defecto si no se encontró
      if (!company) {
        const companySettingsResult = await query("SELECT * FROM company_settings LIMIT 1")
        if (companySettingsResult.rows.length > 0) {
          const settings = companySettingsResult.rows[0]
          company = {
            name: settings.company_name,
            address: settings.company_address,
            phone: settings.company_phone,
            email: settings.company_email,
            logo_url: settings.logo_url,
          }
        }
      }
    } catch (relationError) {
      console.log("[v0] Print endpoint - Error getting related data:", relationError)
      // Continuar con datos básicos
    }

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
      image_url: ticket.image_url,
      location: location || {
        name: "No disponible",
        address: "No disponible",
        contact_person: "No disponible",
        contact_phone: "No disponible",
      },
      technician: technician || {
        name: "No disponible",
        email: "No disponible",
      },
      company: company || {
        name: "Mi Empresa",
        address: "Dirección no disponible",
        phone: "Teléfono no disponible",
        email: "email@empresa.com",
        logo_url: null,
      },
      equipment: equipment || {
        type: "No especificado",
        brand: "No especificado",
        model: "No especificado",
        serial_number: "No especificado",
      },
    }

    console.log("[v0] Print endpoint - Returning formatted ticket")
    return NextResponse.json(formattedTicket)
  } catch (error) {
    console.error("[v0] Print endpoint - Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
