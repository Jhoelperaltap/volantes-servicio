import bcrypt from "bcryptjs"
import { generateToken, type JWTPayload } from "./jwt"
import { query, testConnection } from "./database"

export interface User {
  id: string
  email: string
  name: string
  role: "tecnico" | "admin" | "super_admin"
  is_active: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const connectionOk = await testConnection()
  if (!connectionOk) {
    return null
  }

  const result = await query(
    "SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1 AND is_active = true",
    [email],
  )

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
  }
}

export async function generateUserToken(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  return generateToken(payload)
}
