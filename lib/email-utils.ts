export interface EmailTicketData {
  ticket_number: string
  service_type: string
  priority: string
  status: string
  description: string
  created_at: string
  scheduled_date?: string
  completion_date?: string
  completed_at?: string
  location_name: string
  location_address: string
  location_contact_person: string
  location_contact_phone: string
  client_name: string
  technician_name: string
  technician_email: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  work_performed?: string
  materials_used?: string
  recommendations?: string
  client_signature?: string
  technician_signature?: string
  parts_used?: any[]
  requires_return?: boolean
  pending_items?: string
  technician_signed_at?: string
  client_signed_at?: string
  image_url?: string
  equipment?: {
    type: string
    brand: string
    model: string
    serial_number: string
  }
}

export function generateEmailContent(ticket: EmailTicketData): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada"
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "alta":
        return "#dc2626"
      case "media":
        return "#ea580c"
      case "baja":
        return "#16a34a"
      default:
        return "#6b7280"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completado":
        return "#16a34a"
      case "en_progreso":
        return "#2563eb"
      case "pendiente":
        return "#ea580c"
      case "cancelado":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      mantenimiento: "Mantenimiento",
      reparacion: "Reparación",
      instalacion: "Instalación",
      cambio_repuesto: "Cambio de Repuesto",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusBadge = (status: string, requiresReturn: boolean) => {
    if (status === "pendiente") {
      return { text: "Pendiente", color: "#dc2626" }
    }
    if (requiresReturn) {
      return { text: "Seguimiento", color: "#6b7280" }
    }
    return { text: "Completado", color: "#16a34a" }
  }

  const statusBadge = getStatusBadge(ticket.status, ticket.requires_return || false)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volante de Servicio - ${ticket.ticket_number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: #2563eb; color: white; padding: 20px; border-bottom: 4px solid #1d4ed8; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
        .company-section { display: flex; align-items: center; gap: 15px; }
        .company-logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .company-details h1 { margin: 0; font-size: 24px; }
        .company-details p { margin: 2px 0; opacity: 0.9; font-size: 14px; }
        .ticket-section { text-align: right; }
        .ticket-section h2 { margin: 0; font-size: 20px; }
        .ticket-section p { margin: 2px 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 20px; }
        .section { margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .info-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-card h4 { margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
        .info-item { margin-bottom: 8px; font-size: 13px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6b7280; }
        .badge { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px; }
        .description-section { background: #f1f5f9; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .description-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .description-box h4 { margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: bold; }
        .description-box p { margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5; }
        .parts-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .parts-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .parts-table th, .parts-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }
        .parts-table th { background: #f1f5f9; font-weight: bold; color: #374151; }
        .parts-table td { background: white; }
        .image-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center; }
        .image-section h4 { margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: bold; }
        .image-section img { max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .alert-box h4 { margin: 0 0 8px 0; color: #dc2626; font-size: 14px; font-weight: bold; }
        .alert-box p { margin: 0; color: #991b1b; font-size: 13px; }
        .signature-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .signature-section h3 { margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: bold; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .signature-box { text-align: center; }
        .signature-box h5 { margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold; }
        .signature-placeholder { border: 2px dashed #d1d5db; padding: 20px; border-radius: 4px; background: white; margin-bottom: 10px; min-height: 60px; display: flex; align-items: center; justify-content: center; }
        .signature-info { border-top: 1px solid #d1d5db; padding-top: 8px; }
        .signature-info p { margin: 2px 0; font-size: 12px; color: #6b7280; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; }
        .footer p { margin: 5px 0; }
        @media (max-width: 600px) {
            .header-content { flex-direction: column; gap: 15px; }
            .ticket-section { text-align: left; }
            .info-grid { grid-template-columns: 1fr; }
            .description-grid { grid-template-columns: 1fr; }
            .signature-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header mejorado con estructura similar al volante impreso -->
        <div class="header">
            <div class="header-content">
                <div class="company-section">
                    <div class="company-logo">
                        <span style="font-size: 24px;">🏢</span>
                    </div>
                    <div class="company-details">
                        <h1>${ticket.company_name}</h1>
                        <p>${ticket.company_address}</p>
                        <p>Tel: ${ticket.company_phone} | Email: ${ticket.company_email}</p>
                    </div>
                </div>
                <div class="ticket-section">
                    <h2>VOLANTE DE SERVICIO</h2>
                    <p>#${ticket.ticket_number}</p>
                    <p>Fecha: ${formatDate(ticket.created_at)}</p>
                </div>
            </div>
        </div>
        
        <div class="content">
            <!-- Información del servicio con iconos y mejor estructura -->
            <div class="section">
                <div class="info-grid">
                    <div class="info-card">
                        <h4>📍 Localidad</h4>
                        <div class="info-item">
                            <span class="info-label">Nombre:</span>
                            <span class="info-value">${ticket.location_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Dirección:</span>
                            <span class="info-value">${ticket.location_address}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Contacto:</span>
                            <span class="info-value">${ticket.location_contact_person}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">${ticket.location_contact_phone}</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>👨‍🔧 Técnico</h4>
                        <div class="info-item">
                            <span class="info-label">Nombre:</span>
                            <span class="info-value">${ticket.technician_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${ticket.technician_email || "No disponible"}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Servicio:</span>
                            <span class="info-value">${getServiceTypeLabel(ticket.service_type)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado:</span>
                            <span class="badge" style="background-color: ${statusBadge.color}">${statusBadge.text}</span>
                        </div>
                    </div>

                    ${
                      ticket.equipment
                        ? `
                    <div class="info-card">
                        <h4>📦 Equipo</h4>
                        <div class="info-item">
                            <span class="info-label">Tipo:</span>
                            <span class="info-value">${ticket.equipment.type || "No especificado"}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Marca:</span>
                            <span class="info-value">${ticket.equipment.brand || "No especificado"}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Modelo:</span>
                            <span class="info-value">${ticket.equipment.model || "No especificado"}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Serie:</span>
                            <span class="info-value">${ticket.equipment.serial_number || "No especificado"}</span>
                        </div>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>

            <!-- Descripción del trabajo con mejor estructura -->
            <div class="description-section">
                <div class="description-grid">
                    <div class="description-box">
                        <h4>Descripción del Problema</h4>
                        <p>${ticket.description || "No se proporcionó descripción"}</p>
                    </div>
                    ${
                      ticket.work_performed
                        ? `
                    <div class="description-box">
                        <h4>Trabajo Realizado</h4>
                        <p>${ticket.work_performed}</p>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>

            <!-- Sección de repuestos e imagen mejorada -->
            <div class="info-grid">
                ${
                  ticket.parts_used && ticket.parts_used.length > 0
                    ? `
                <div class="parts-section">
                    <h4 style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: bold;">Repuestos Utilizados</h4>
                    <table class="parts-table">
                        <thead>
                            <tr>
                                <th>Repuesto</th>
                                <th style="text-align: center;">Cant.</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ticket.parts_used
                              .map(
                                (part: any) => `
                            <tr>
                                <td>${part.name}</td>
                                <td style="text-align: center;">${part.quantity}</td>
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
                  ticket.image_url
                    ? `
                <div class="image-section">
                    <h4>Imagen de Referencia</h4>
                    <img src="${ticket.image_url}" alt="Imagen del volante de servicio" />
                </div>
                `
                    : ""
                }
            </div>

            <!-- Items pendientes con mejor estilo -->
            ${
              ticket.pending_items
                ? `
            <div class="alert-box">
                <h4>⚠️ Items Pendientes</h4>
                <p>${ticket.pending_items}</p>
            </div>
            `
                : ""
            }

            <!-- Firmas digitales con estructura mejorada -->
            ${
              ticket.client_signature || ticket.technician_signature
                ? `
            <div class="signature-section">
                <h3>Firmas Digitales</h3>
                <div class="signature-grid">
                    <div class="signature-box">
                        <h5>Firma del Técnico</h5>
                        <div class="signature-placeholder">
                            ${
                              ticket.technician_signature
                                ? `<img src="${ticket.technician_signature}" alt="Firma del técnico" style="max-width: 100%; max-height: 60px;">`
                                : '<span style="color: #9ca3af; font-size: 12px;">Sin firma</span>'
                            }
                        </div>
                        <div class="signature-info">
                            <p><strong>${ticket.technician_name}</strong></p>
                            <p>Técnico</p>
                            <p>${ticket.technician_signed_at ? formatDate(ticket.technician_signed_at) : "Sin fecha"}</p>
                        </div>
                    </div>
                    <div class="signature-box">
                        <h5>Firma del Cliente</h5>
                        <div class="signature-placeholder">
                            ${
                              ticket.client_signature
                                ? `<img src="${ticket.client_signature}" alt="Firma del cliente" style="max-width: 100%; max-height: 60px;">`
                                : '<span style="color: #9ca3af; font-size: 12px;">Sin firma</span>'
                            }
                        </div>
                        <div class="signature-info">
                            <p><strong>${ticket.location_contact_person}</strong></p>
                            <p>Cliente</p>
                            <p>${ticket.client_signed_at ? formatDate(ticket.client_signed_at) : "Sin fecha"}</p>
                        </div>
                    </div>
                </div>
            </div>
            `
                : ""
            }
        </div>
        
        <!-- Footer mejorado -->
        <div class="footer">
            <p><strong>${ticket.company_name}</strong></p>
            <p>${ticket.company_address}</p>
            <p>Teléfono: ${ticket.company_phone} | Email: ${ticket.company_email}</p>
            <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                Generado automáticamente el ${new Date().toLocaleString()} - Volante #${ticket.ticket_number}
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}
