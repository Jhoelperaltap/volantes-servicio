import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener empresas
    const companiesResult = await query(`SELECT id, name FROM companies WHERE is_active = true ORDER BY name`)

    // Obtener clientes
    const clientsResult = await query(
      `SELECT c.id, c.name, c.company_id 
       FROM clients c 
       WHERE c.is_active = true 
       ORDER BY c.name`,
    )

    // Obtener localidades
    const locationsResult = await query(
      `SELECT cl.id, cl.name, cl.client_id 
       FROM client_locations cl 
       WHERE cl.is_active = true 
       ORDER BY cl.name`,
    )

    // Obtener técnicos
    const techniciansResult = await query(`SELECT id, name FROM users WHERE role = 'tecnico' ORDER BY name`)

    // Obtener tipos de equipo únicos
    const equipmentTypesResult = await query(
      `SELECT DISTINCT equipment_type 
       FROM equipment 
       WHERE equipment_type IS NOT NULL AND equipment_type != '' 
       ORDER BY equipment_type`,
    )

    return NextResponse.json({
      companies: companiesResult.rows,
      clients: clientsResult.rows,
      locations: locationsResult.rows,
      technicians: techniciansResult.rows,
      equipmentTypes: equipmentTypesResult.rows.map((row) => row.equipment_type),
    })
  } catch (error) {
    console.error("Error fetching search options:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
