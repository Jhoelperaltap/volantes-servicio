import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, testEmailConnection } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (userRole !== "admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { testType, recipient } = await request.json()

    if (testType === "connection") {
      // Probar solo la conexión SMTP
      const result = await testEmailConnection()
      return NextResponse.json(result)
    }

    if (testType === "send" && recipient) {
      // Enviar email de prueba
      const testEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email de Prueba - Sistema de Volantes</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧪 Email de Prueba</h1>
                <h2>Sistema de Volantes de Servicio</h2>
            </div>
            
            <div class="content">
                <h3>¡Configuración de Email Exitosa!</h3>
                <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                    <h4>Detalles de la Prueba:</h4>
                    <ul>
                        <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                        <li><strong>Sistema:</strong> Volantes de Servicio Técnico</li>
                        <li><strong>Estado:</strong> ✅ Funcionando correctamente</li>
                    </ul>
                </div>
                
                <p>Si recibiste este email, significa que:</p>
                <ul>
                    <li>✅ La configuración SMTP es correcta</li>
                    <li>✅ El servidor puede enviar emails</li>
                    <li>✅ Los volantes de servicio se podrán enviar por email</li>
                </ul>
            </div>

            <div class="footer">
                <p>Este email fue generado automáticamente por el sistema de pruebas</p>
                <p>Fecha de envío: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
      `

      const result = await sendEmail({
        to: recipient,
        subject: "🧪 Prueba de Email - Sistema de Volantes",
        html: testEmailContent,
      })

      return NextResponse.json({
        success: true,
        message: "Email de prueba enviado exitosamente",
        messageId: result.messageId,
        recipient,
      })
    }

    return NextResponse.json({ error: "Tipo de prueba no válido" }, { status: 400 })
  } catch (error: any) {
    console.error("Error en prueba de email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al probar email",
        details: error.code || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
