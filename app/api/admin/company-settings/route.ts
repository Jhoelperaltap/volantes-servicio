import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!["admin", "super_admin"].includes(userRole || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await query("SELECT * FROM company_settings ORDER BY created_at DESC LIMIT 1", [])

    if (result.rows.length === 0) {
      // Si no hay configuración, devolver valores por defecto
      return NextResponse.json({
        id: null,
        company_name: "",
        company_address: "",
        company_phone: "",
        company_email: "",
        logo_url: null,
      })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!["admin", "super_admin"].includes(userRole || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { company_name, company_address, company_phone, company_email, logo_url } = body

    // Verificar si ya existe una configuración
    const existingResult = await query("SELECT id FROM company_settings ORDER BY created_at DESC LIMIT 1", [])

    let result
    if (existingResult.rows.length === 0) {
      // Crear nueva configuración
      result = await query(
        `INSERT INTO company_settings (company_name, company_address, company_phone, company_email, logo_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [company_name, company_address, company_phone, company_email, logo_url],
      )
    } else {
      // Actualizar configuración existente
      result = await query(
        `UPDATE company_settings 
         SET company_name = $1, company_address = $2, company_phone = $3, 
             company_email = $4, logo_url = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [company_name, company_address, company_phone, company_email, logo_url, existingResult.rows[0].id],
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating company settings:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
