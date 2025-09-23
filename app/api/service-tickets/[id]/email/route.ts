import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { generateEmailContent } from "@/lib/email-utils"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] Email endpoint - Starting request")

    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      console.log("[v0] Email endpoint - No user ID")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { recipients } = body

    console.log("[v0] Email endpoint - Ticket ID:", id)
    console.log("[v0] Email endpoint - Recipients from request:", recipients)

    // Obtener el volante básico
    let whereClause = "WHERE id = $1"
    const queryParams = [id]

    if (userRole === "tecnico") {
      whereClause += " AND technician_id = $2"
      queryParams.push(userId)
    }

    const ticketResult = await query(`SELECT * FROM service_tickets ${whereClause}`, queryParams)

    if (ticketResult.rows.length === 0) {
      console.log("[v0] Email endpoint - Ticket not found")
      return NextResponse.json({ error: "Volante no encontrado" }, { status: 404 })
    }

    const ticket = ticketResult.rows[0]
    console.log("[v0] Email endpoint - Ticket found:", ticket.ticket_number)

    // Obtener información relacionada
    let location = null
    let technician = null
    let company = null
    let client = null

    try {
      // Obtener ubicación
      if (ticket.location_id) {
        console.log("[v0] Email endpoint - Getting location:", ticket.location_id)
        const locationResult = await query("SELECT * FROM client_locations WHERE id = $1", [ticket.location_id])
        if (locationResult.rows.length > 0) {
          location = locationResult.rows[0]
          console.log("[v0] Email endpoint - Location found:", location.name)

          // Obtener cliente a través de location
          if (location.client_id) {
            console.log("[v0] Email endpoint - Getting client:", location.client_id)
            const clientResult = await query("SELECT * FROM clients WHERE id = $1", [location.client_id])
            if (clientResult.rows.length > 0) {
              client = clientResult.rows[0]
              console.log("[v0] Email endpoint - Client found:", client.name)
            }
          }

          // Obtener empresa a través de client_locations
          if (location.company_id) {
            console.log("[v0] Email endpoint - Getting company:", location.company_id)
            const companyResult = await query("SELECT * FROM companies WHERE id = $1", [location.company_id])
            if (companyResult.rows.length > 0) {
              company = companyResult.rows[0]
              console.log("[v0] Email endpoint - Company found:", company.name)
            }
          }
        }
      }

      // Obtener técnico
      if (ticket.technician_id) {
        console.log("[v0] Email endpoint - Getting technician:", ticket.technician_id)
        const technicianResult = await query("SELECT name, email FROM users WHERE id = $1", [ticket.technician_id])
        if (technicianResult.rows.length > 0) {
          technician = technicianResult.rows[0]
          console.log("[v0] Email endpoint - Technician found:", technician.name, technician.email)
        }
      }

      // Obtener configuración de empresa por defecto si no se encontró
      if (!company) {
        console.log("[v0] Email endpoint - Getting default company settings")
        const companySettingsResult = await query("SELECT * FROM company_settings LIMIT 1")
        if (companySettingsResult.rows.length > 0) {
          company = companySettingsResult.rows[0]
          console.log("[v0] Email endpoint - Default company found:", company.company_name || company.name)
        }
      }
    } catch (relationError) {
      console.log("[v0] Email endpoint - Error getting related data:", relationError)
    }

    // Formatear datos para el email
    const formattedTicket = {
      ...ticket,
      location_name: location?.name || "No disponible",
      location_address: location?.address || "No disponible",
      location_contact_person: location?.contact_person || "No disponible",
      location_contact_phone: location?.contact_phone || "No disponible",
      location_contact_email: location?.contact_email || "",
      client_name: client?.name || "No disponible",
      client_email: client?.email || "",
      technician_name: technician?.name || "No disponible",
      technician_email: technician?.email || "",
      company_name: company?.name || company?.company_name || "Mi Empresa",
      company_address: company?.address || company?.company_address || "Dirección no disponible",
      company_phone: company?.phone || company?.company_phone || "Teléfono no disponible",
      company_email: company?.contact_email || company?.company_email || "email@empresa.com",
      company_logo_url: company?.logo_url || company?.company_logo_url || "",
    }

    let recipientsList = []

    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      // Si se proporcionaron recipients específicos, usarlos
      recipientsList = recipients
    } else {
      // Si no se proporcionaron recipients, usar correos de empresa y cliente
      const potentialRecipients = [
        formattedTicket.company_email,
        formattedTicket.client_email,
        formattedTicket.location_contact_email,
        formattedTicket.technician_email,
      ].filter((email) => email && email !== "" && email !== "email@empresa.com")

      recipientsList = [...new Set(potentialRecipients)] // Eliminar duplicados
    }

    console.log("[v0] Email endpoint - Final recipients list:", recipientsList)
    console.log("[v0] Email endpoint - Company email:", formattedTicket.company_email)
    console.log("[v0] Email endpoint - Client email:", formattedTicket.client_email)
    console.log("[v0] Email endpoint - Location email:", formattedTicket.location_contact_email)

    if (recipientsList.length === 0) {
      console.log("[v0] Email endpoint - No recipients found, cannot send email")
      return NextResponse.json(
        {
          error: "No se encontraron destinatarios válidos",
          details: "Verifica que la empresa y cliente tengan emails configurados",
          company_email: formattedTicket.company_email,
          client_email: formattedTicket.client_email,
          location_email: formattedTicket.location_contact_email,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Email endpoint - Generating email content...")
    const emailContent = generateEmailContent(formattedTicket)
    console.log("[v0] Email endpoint - Email content generated, length:", emailContent.length)

    try {
      console.log("[v0] Email endpoint - Attempting to send email...")
      console.log("[v0] Email endpoint - Recipients:", recipientsList)
      console.log(
        "[v0] Email endpoint - Subject:",
        `Volante de Servicio #${formattedTicket.ticket_number} - ${formattedTicket.company_name}`,
      )

      const emailResult = await sendEmail({
        to: recipientsList,
        subject: `Volante de Servicio #${formattedTicket.ticket_number} - ${formattedTicket.company_name}`,
        html: emailContent,
      })

      console.log("[v0] Email endpoint - Email sent successfully:", emailResult.messageId)
      console.log("[v0] Email endpoint - Email result:", emailResult)

      return NextResponse.json({
        success: true,
        message: `Email enviado correctamente a ${recipientsList.length} destinatario(s)`,
        recipients: recipientsList,
        messageId: emailResult.messageId,
      })
    } catch (emailError) {
      console.error("[v0] Email endpoint - Error sending email:", emailError)
      return NextResponse.json(
        {
          error: "Error al enviar email",
          details: emailError.message,
          recipients: recipientsList,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Email endpoint - Error:", error)
    return NextResponse.json({ error: "Error al enviar email" }, { status: 500 })
  }
}
