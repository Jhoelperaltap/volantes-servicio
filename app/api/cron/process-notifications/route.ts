import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Ejecutar la función de procesamiento de notificaciones
    await query("SELECT process_notifications()")

    return NextResponse.json({
      success: true,
      message: "Notificaciones procesadas correctamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing notifications:", error)
    return NextResponse.json(
      {
        error: "Error al procesar notificaciones",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // Permitir tanto GET como POST para flexibilidad con cron jobs
  return GET()
}
