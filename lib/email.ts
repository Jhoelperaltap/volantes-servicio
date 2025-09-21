import nodemailer from "nodemailer"

// Configuración del transportador de email
export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Función para enviar email
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  const transporter = createEmailTransporter()

  const mailOptions = {
    from: from || process.env.SMTP_USER,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("[v0] Email enviado exitosamente:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error enviando email:", error)
    throw error
  }
}

// Función para probar la configuración SMTP
export async function testEmailConnection() {
  try {
    const transporter = createEmailTransporter()
    await transporter.verify()
    console.log("[v0] Conexión SMTP verificada exitosamente")
    return { success: true, message: "Conexión SMTP exitosa" }
  } catch (error) {
    console.error("[v0] Error en conexión SMTP:", error)
    throw error
  }
}
