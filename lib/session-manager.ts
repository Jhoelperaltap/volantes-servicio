import { query } from "./database"
import { generateToken, verifyToken, type JWTPayload } from "./jwt"
import { v4 as uuidv4 } from "uuid"

export interface SessionInfo {
  id: string
  userId: string
  deviceName?: string
  ipAddress?: string
  isActive: boolean
  lastActivity: Date
  expiresAt: Date
  createdAt: Date
}

export interface DeviceInfo {
  fingerprint: string
  name: string
  userAgent: string
  ipAddress: string
}

export class SessionManager {
  static async createSession(
    userId: string,
    email: string,
    role: string,
    deviceInfo: DeviceInfo,
    sessionTimeoutMinutes = 480, // 8 horas por defecto
  ): Promise<{ token: string; sessionId: string }> {
    const tokenId = uuidv4()
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000)

    const token = await generateToken({
      userId,
      email,
      role,
      tokenId,
      sessionId,
    })

    try {
      await query(
        `INSERT INTO user_sessions (
          id, user_id, session_token, device_info, ip_address, user_agent, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          userId,
          tokenId,
          JSON.stringify({
            name: deviceInfo.name,
            fingerprint: deviceInfo.fingerprint,
          }),
          deviceInfo.ipAddress,
          deviceInfo.userAgent,
          expiresAt,
        ],
      )

      // Limpiar sesiones expiradas y aplicar límites
      await this.cleanupExpiredSessions()
      await this.enforceSessionLimits(userId)
    } catch (error) {
      console.error("Error guardando sesión:", error)
      // Continuar aunque falle el guardado en BD
    }

    return { token, sessionId }
  }

  static async verifySession(token: string): Promise<JWTPayload | null> {
    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    try {
      const sessionResult = await query(
        `SELECT id, is_active, expires_at FROM user_sessions 
         WHERE session_token = $1 AND user_id = $2 AND is_active = true`,
        [payload.tokenId, payload.userId],
      )

      if (sessionResult.rows.length === 0) {
        return null
      }

      const session = sessionResult.rows[0]
      if (new Date(session.expires_at) < new Date()) {
        // Sesión expirada, marcar como inactiva
        await query(`UPDATE user_sessions SET is_active = false WHERE id = $1`, [session.id])
        return null
      }

      if (payload.tokenId) {
        await this.updateLastActivity(payload.tokenId)
      }
    } catch (error) {
      console.error("Error verificando sesión:", error)
      // Continuar con verificación básica del usuario
    }

    const result = await query("SELECT id, is_active FROM users WHERE id = $1 AND is_active = true", [payload.userId])

    if (result.rows.length === 0) {
      return null
    }

    return payload
  }

  static async updateLastActivity(tokenId: string): Promise<void> {
    try {
      await query(
        `UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP 
         WHERE session_token = $1 AND is_active = true`,
        [tokenId],
      )
    } catch (error) {
      console.error("Error actualizando actividad de sesión:", error)
    }
  }

  static async logout(tokenId: string): Promise<void> {
    try {
      await query(
        `UPDATE user_sessions SET is_active = false 
         WHERE session_token = $1`,
        [tokenId],
      )
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    }
  }

  static async logoutAllDevices(userId: string, currentTokenId?: string): Promise<number> {
    try {
      let queryText = `UPDATE user_sessions SET is_active = false 
                       WHERE user_id = $1 AND is_active = true`
      const params = [userId]

      if (currentTokenId) {
        queryText += ` AND session_token != $2`
        params.push(currentTokenId)
      }

      const result = await query(queryText, params)
      return result.rowCount || 0
    } catch (error) {
      console.error("Error cerrando todas las sesiones:", error)
      return 0
    }
  }

  static async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const result = await query(
        `SELECT id, user_id, device_info, ip_address, last_activity, 
                created_at, expires_at, is_active
         FROM user_sessions 
         WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
         ORDER BY last_activity DESC`,
        [userId],
      )

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        deviceName: row.device_info?.name || "Dispositivo desconocido",
        ipAddress: row.ip_address,
        isActive: row.is_active,
        lastActivity: new Date(row.last_activity),
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
      }))
    } catch (error) {
      console.error("Error obteniendo sesiones activas:", error)
      return []
    }
  }

  static async enforceSessionLimits(userId: string): Promise<void> {
    try {
      // Obtener configuración de límites
      const settingsResult = await query(`SELECT max_sessions FROM session_settings LIMIT 1`)

      const maxSessions = settingsResult.rows[0]?.max_sessions || 5

      // Obtener sesiones activas ordenadas por última actividad
      const sessionsResult = await query(
        `SELECT id FROM user_sessions 
         WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
         ORDER BY last_activity ASC`,
        [userId],
      )

      if (sessionsResult.rows.length > maxSessions) {
        // Cerrar las sesiones más antiguas
        const sessionsToClose = sessionsResult.rows.slice(0, sessionsResult.rows.length - maxSessions)
        const sessionIds = sessionsToClose.map((row) => row.id)

        await query(
          `UPDATE user_sessions SET is_active = false 
           WHERE id = ANY($1)`,
          [sessionIds],
        )
      }
    } catch (error) {
      console.error("Error aplicando límites de sesión:", error)
    }
  }

  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await query(
        `UPDATE user_sessions SET is_active = false 
         WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true`,
      )

      // Eliminar sesiones muy antiguas (más de 30 días)
      await query(
        `DELETE FROM user_sessions 
         WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'`,
      )
    } catch (error) {
      console.error("Error limpiando sesiones expiradas:", error)
    }
  }

  static async isNewDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT id FROM user_sessions 
         WHERE user_id = $1 AND device_info->>'fingerprint' = $2
         LIMIT 1`,
        [userId, deviceFingerprint],
      )

      return result.rows.length === 0
    } catch (error) {
      console.error("Error verificando dispositivo nuevo:", error)
      return false
    }
  }
}
