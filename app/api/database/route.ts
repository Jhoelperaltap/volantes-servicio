import { type NextRequest, NextResponse } from "next/server"

// En desarrollo, simular respuestas de base de datos
const mockResponses: Record<string, any> = {
  "SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1 AND is_active = true": {
    rows: [],
    rowCount: 0,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json()

    // En desarrollo, retornar datos mock
    if (process.env.NODE_ENV === "development") {
      const mockKey = query.split("WHERE")[0].trim()
      const response = mockResponses[query] ||
        mockResponses[mockKey] || {
          rows: [],
          rowCount: 0,
        }

      return NextResponse.json(response)
    }

    // En producción, aquí iría la conexión real a PostgreSQL
    // Por ahora retornar error para indicar que falta configuración
    return NextResponse.json({ error: "Database not configured for production" }, { status: 500 })
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ error: "Database query failed" }, { status: 500 })
  }
}
