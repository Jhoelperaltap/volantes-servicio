import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!["admin", "super_admin"].includes(userRole || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validate file type with more specific checks
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WebP",
        },
        { status: 400 },
      )
    }

    // Validate file size (2MB max for better performance)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "El archivo es muy grande (máximo 2MB). Considera comprimir la imagen.",
        },
        { status: 400 },
      )
    }

    // Validate minimum file size (1KB to avoid empty files)
    if (file.size < 1024) {
      return NextResponse.json(
        {
          error: "El archivo es muy pequeño. Asegúrate de subir una imagen válida.",
        },
        { status: 400 },
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "logos")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    try {
      const currentSettings = await query("SELECT logo_url FROM company_settings LIMIT 1")
      if (currentSettings.rows.length > 0 && currentSettings.rows[0].logo_url) {
        const oldLogoUrl = currentSettings.rows[0].logo_url
        if (oldLogoUrl.startsWith("/uploads/logos/")) {
          const oldFilePath = join(process.cwd(), "public", oldLogoUrl)
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath)
          }
        }
      }
    } catch (error) {
      // Could not remove old logo (this is okay)
    }

    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop()?.toLowerCase() || "png"
    const sanitizedExtension = extension.replace(/[^a-z0-9]/g, "")
    const filename = `logo-${timestamp}-${randomSuffix}.${sanitizedExtension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileHeader = buffer.slice(0, 4)
    const isValidImage =
      (fileHeader[0] === 0xff && fileHeader[1] === 0xd8) || // JPEG
      (fileHeader[0] === 0x89 && fileHeader[1] === 0x50) || // PNG
      (fileHeader[0] === 0x47 && fileHeader[1] === 0x49) || // GIF
      fileHeader.toString("ascii", 0, 4) === "RIFF" // WebP

    if (!isValidImage) {
      return NextResponse.json(
        {
          error: "El archivo no es una imagen válida",
        },
        { status: 400 },
      )
    }

    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/logos/${filename}`

    return NextResponse.json({
      message: "Logo subido exitosamente",
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
