import { Pool } from "pg"

let pool: Pool

if (process.env.DATABASE_URL) {
  console.log("[v0] Using DATABASE_URL for connection")
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })
} else {
  console.log("[v0] Using individual DB environment variables")
  console.log("[v0] DB_HOST:", process.env.DB_HOST || "localhost")
  console.log("[v0] DB_NAME:", process.env.DB_NAME || "volante_servicio")
  console.log("[v0] DB_USER:", process.env.DB_USER || "postgres")
  console.log("[v0] DB_PASSWORD exists:", !!process.env.DB_PASSWORD)

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
    console.log("[v0] Database query:", text, params)
    const result = await pool.query(text, params)
    console.log("[v0] Database query result:", result.rows.length, "rows found")

    if (result.rows.length > 0) {
      console.log("[v0] First row:", result.rows[0])
    }

    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() as current_time")
    console.log("[v0] Database connection successful:", result.rows[0])
    return true
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return false
  }
}

export { pool }
