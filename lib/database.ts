import { Pool } from "pg"

let pool: Pool

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ⚠️ Solo activa SSL si tu base soporta
    ssl: process.env.FORCE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  })
} else {
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "volante_servicio",
    user: process.env.DB_USER || "postgres",
    password: String(process.env.DB_PASSWORD || ""),
    ssl: process.env.FORCE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  })
}

export async function query(text: string, params: any[] = []) {
  try {
    return await pool.query(text, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function testConnection() {
  try {
    await pool.query("SELECT NOW()")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

export { pool }
