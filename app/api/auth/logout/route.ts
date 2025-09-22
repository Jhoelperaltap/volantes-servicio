import { NextResponse, type NextRequest } from "next/server"
import { SessionManager } from "@/lib/session-manager"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (token) {
      const payload = await verifyToken(token)
      if (payload && payload.tokenId) {
        await SessionManager.logout(payload.tokenId)
      }
    }

    cookieStore.delete("auth-token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en logout:", error)
    // Aún así eliminar la cookie aunque haya error
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
    return NextResponse.json({ success: true })
  }
}
