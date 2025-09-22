import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, isTokenExpiringSoon } from "./lib/jwt"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  console.log("[v0] Middleware - Path:", request.nextUrl.pathname)
  console.log("[v0] Middleware - Token exists:", !!token)

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/login", "/api/auth/login"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Verificar token para rutas protegidas
  if (!token) {
    console.log("[v0] Middleware - No token, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const decoded = await verifyToken(token)
  console.log("[v0] Middleware - Token decoded:", !!decoded, decoded ? `Role: ${decoded.role}` : "Failed to decode")

  if (!decoded) {
    console.log("[v0] Middleware - Invalid token, redirecting to login")
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth-token")
    return response
  }

  const isExpiringSoon = await isTokenExpiringSoon(token, 15)

  // Agregar información del usuario a los headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", decoded.userId)
  requestHeaders.set("x-user-role", decoded.role)
  if (decoded.sessionId) {
    requestHeaders.set("x-session-id", decoded.sessionId)
  }
  if (decoded.tokenId) {
    requestHeaders.set("x-token-id", decoded.tokenId)
  }

  if (isExpiringSoon) {
    requestHeaders.set("x-token-expiring-soon", "true")
  }

  console.log("[v0] Middleware - Headers set, role:", decoded.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/volantes/:path*",
    "/api/protected/:path*",
    "/api/auth/me",
    "/api/notifications/:path*",
    "/api/locations/:path*",
    "/api/parts/:path*",
    "/api/service-tickets/:path*",
    "/api/dashboard/:path*",
    "/api/admin/:path*",
    "/api/upload/:path*",
    "/api/chat/:path*",
    "/api/test-email", // agregando endpoint de prueba de email al middleware
  ],
}


