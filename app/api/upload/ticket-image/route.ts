import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    // For development, we'll allow uploads without strict user validation
    if (!userId) {
      console.warn("No user ID provided, allowing upload for development")
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validate file size (10MB max for ticket images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es muy grande (máximo 10MB)" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "tickets")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `ticket-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/tickets/${filename}`

    return NextResponse.json({
      message: "Imagen subida exitosamente",
      url: publicUrl,
      filename: filename,
    })
  } catch (error) {
    console.error("Error uploading ticket image:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
