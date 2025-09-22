import { Pool } from "pg"

let pool: Pool

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })
} else {
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "volante_servicio",
    user: process.env.DB_USER || "postgres",
    password: String(process.env.DB_PASSWORD || ""),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })
}

export async function query(text: string, params: any[] = []) {
  try {
    const result = await pool.query(text, params)
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  let query = strings[0]
  const params: any[] = []

  for (let i = 0; i < values.length; i++) {
    query += `$${i + 1}` + strings[i + 1]
    params.push(values[i])
  }

  return pool.query(query, params).then((result) => result.rows)
}

export async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() as current_time")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

export { pool }
