import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { recipients } = await request.json()

    // Obtener datos del volante
    let whereClause = "WHERE st.id = $1"
    const queryParams = [id]

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
        l.contact_email as location_contact_email,
        u.name as technician_name,
        u.email as technician_email,
        cs.company_name,
        cs.company_address,
        cs.company_phone,
        cs.company_email
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

    // Generar contenido del email
    const emailContent = generateEmailContent(ticket)
    const recipientsList = recipients || [ticket.location_contact_email, ticket.technician_email].filter(Boolean)

    try {
      const emailResult = await sendEmail({
        to: recipientsList,
        subject: `Volante de Servicio #${ticket.ticket_number} - ${ticket.company_name}`,
        html: emailContent,
      })

      return NextResponse.json({
        success: true,
        message: "Email enviado correctamente",
        recipients: recipientsList,
        messageId: emailResult.messageId,
      })
    } catch (emailError: any) {
      console.error("Error enviando email del volante:", emailError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al enviar email",
          details: emailError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Error al enviar email" }, { status: 500 })
  }
}

function generateEmailContent(ticket: any) {
  const serviceTypeLabels = {
    mantenimiento: "Mantenimiento",
    reparacion: "Reparación",
    instalacion: "Instalación",
    cambio_repuesto: "Cambio de Repuesto",
  }

  const serviceType = serviceTypeLabels[ticket.service_type as keyof typeof serviceTypeLabels] || ticket.service_type

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Volante de Servicio #${ticket.ticket_number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .info-section { margin-bottom: 20px; }
        .info-title { font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .parts-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .parts-table th, .parts-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .parts-table th { background-color: #f2f2f2; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${ticket.company_name}</h1>
        <h2>Volante de Servicio #${ticket.ticket_number}</h2>
    </div>
    
    <div class="content">
        <div class="info-section">
            <div class="info-title">Información del Servicio</div>
            <p><strong>Fecha:</strong> ${new Date(ticket.created_at).toLocaleDateString()}</p>
            <p><strong>Tipo de Servicio:</strong> ${serviceType}</p>
            <p><strong>Estado:</strong> ${ticket.status === "completado" ? "Completado" : ticket.status === "pendiente" ? "Pendiente" : "Escalado"}</p>
        </div>

        <div class="info-section">
            <div class="info-title">Localidad</div>
            <p><strong>Nombre:</strong> ${ticket.location_name}</p>
            <p><strong>Dirección:</strong> ${ticket.location_address}</p>
            <p><strong>Contacto:</strong> ${ticket.location_contact_person}</p>
            <p><strong>Teléfono:</strong> ${ticket.location_contact_phone}</p>
        </div>

        <div class="info-section">
            <div class="info-title">Técnico</div>
            <p><strong>Nombre:</strong> ${ticket.technician_name}</p>
            <p><strong>Email:</strong> ${ticket.technician_email}</p>
        </div>

        <div class="info-section">
            <div class="info-title">Descripción del Problema</div>
            <p>${ticket.description}</p>
        </div>

        ${
          ticket.work_performed
            ? `
        <div class="info-section">
            <div class="info-title">Trabajo Realizado</div>
            <p>${ticket.work_performed}</p>
        </div>
        `
            : ""
        }

        ${
          ticket.parts_used && ticket.parts_used.length > 0
            ? `
        <div class="info-section">
            <div class="info-title">Repuestos Utilizados</div>
            <table class="parts-table">
                <thead>
                    <tr>
                        <th>Repuesto</th>
                        <th>Cantidad</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    ${ticket.parts_used
                      .map(
                        (part: any) => `
                    <tr>
                        <td>${part.name}</td>
                        <td>${part.quantity}</td>
                        <td>${part.notes || "-"}</td>
                    </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        `
            : ""
        }

        ${
          ticket.pending_items
            ? `
        <div class="info-section">
            <div class="info-title" style="color: #dc2626;">Items Pendientes</div>
            <p style="color: #dc2626;">${ticket.pending_items}</p>
        </div>
        `
            : ""
        }
    </div>

    <div class="footer">
        <p>Este volante fue generado automáticamente por el sistema de ${ticket.company_name}</p>
        <p>${ticket.company_address} | Tel: ${ticket.company_phone} | Email: ${ticket.company_email}</p>
        <p>Fecha de generación: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `
}
