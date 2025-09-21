import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload as JoseJWTPayload } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface JWTPayload extends JoseJWTPayload {
  userId: string
  email: string
  role: "tecnico" | "admin" | "super_admin"
  [key: string]: any // Index signature para compatibilidad
}

export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Cambiado de 24h a 2h
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (
      payload &&
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return payload as JWTPayload
    }
    return null
  } catch (error) {
    return null
  }
}

export async function isTokenExpiringSoon(token: string, minutesThreshold = 15): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const exp = payload.exp as number
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = exp - now
    const thresholdInSeconds = minutesThreshold * 60

    return timeUntilExpiry <= thresholdInSeconds
  } catch (error) {
    return true // Si hay error, considerar que está expirando
  }
}
