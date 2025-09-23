import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin", "tecnico"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get("company_id")
    const client_id = searchParams.get("client_id")
    const location_id = searchParams.get("location_id")

    // Si no hay parámetros, devolver todas las empresas
    if (!company_id && !client_id && !location_id) {
      const result = await query(`
        SELECT id, name
        FROM companies
        WHERE is_active = true
        ORDER BY name
      `)
      return NextResponse.json({ companies: result.rows })
    }

    // Si solo hay company_id, devolver clientes de esa empresa
    if (company_id && !client_id && !location_id) {
      const result = await query(
        `
        SELECT id, name
        FROM clients
        WHERE company_id = $1 AND is_active = true
        ORDER BY name
      `,
        [company_id],
      )
      return NextResponse.json({ clients: result.rows })
    }

    // Si hay company_id y client_id, devolver localidades de ese cliente
    if (company_id && client_id && !location_id) {
      const result = await query(
        `
        SELECT id, name, address, city
        FROM client_locations
        WHERE client_id = $1 AND is_active = true
        ORDER BY name
      `,
        [client_id],
      )
      return NextResponse.json({ locations: result.rows })
    }

    // Si hay todos los parámetros, devolver equipos de esa localidad
    if (company_id && client_id && location_id) {
      const result = await query(
        `
        SELECT id, name, model, serial_number, equipment_type
        FROM equipment
        WHERE location_id = $1 AND is_active = true
        ORDER BY name
      `,
        [location_id],
      )
      return NextResponse.json({ equipment: result.rows })
    }

    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  } catch (error) {
    console.error("Error in cascade selection:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
