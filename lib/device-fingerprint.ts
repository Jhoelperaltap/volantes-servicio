export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  // Crear un hash simple basado en user agent e IP
  const crypto = require("crypto")
  const data = `${userAgent}-${ipAddress}`
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 32)
}

export function parseDeviceName(userAgent: string): string {
  // Extraer información básica del dispositivo del user agent
  if (userAgent.includes("Mobile")) {
    if (userAgent.includes("iPhone")) return "iPhone"
    if (userAgent.includes("Android")) return "Android"
    return "Móvil"
  }

  if (userAgent.includes("Chrome")) return "Chrome Desktop"
  if (userAgent.includes("Firefox")) return "Firefox Desktop"
  if (userAgent.includes("Safari")) return "Safari Desktop"
  if (userAgent.includes("Edge")) return "Edge Desktop"

  return "Navegador Desktop"
}

export interface DeviceInfo {
  fingerprint: string
  name: string
  userAgent: string
  ipAddress: string
}

export function extractDeviceInfo(request: Request): DeviceInfo {
  const userAgent = request.headers.get("user-agent") || ""
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"

  return {
    fingerprint: generateDeviceFingerprint(userAgent, ipAddress),
    name: parseDeviceName(userAgent),
    userAgent,
    ipAddress,
  }
}
