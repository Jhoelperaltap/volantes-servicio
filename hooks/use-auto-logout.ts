"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface UseAutoLogoutOptions {
  checkInterval?: number // en minutos
  warningTime?: number // en minutos antes de logout
  onWarning?: () => void
  onLogout?: () => void
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    checkInterval = 15, // Verificar cada 15 minutos (menos frecuente)
    warningTime = 5, // avisar 5 minutos antes
    onWarning,
    onLogout,
  } = options

  const router = useRouter()

  const performLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      onLogout?.()
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      // Forzar redirección incluso si falla la llamada
      router.push("/login")
    }
  }, [router, onLogout])

  const checkTokenValidity = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        // Token expirado o inválido
        await performLogout()
        return false
      }

      const tokenExpiringSoon = response.headers.get("x-token-expiring-soon")
      if (tokenExpiringSoon === "true") {
        onWarning?.()
      }

      return true
    } catch (error) {
      console.error("Error checking token validity:", error)
      await performLogout()
      return false
    }
  }, [performLogout, onWarning])

  useEffect(() => {
    // Verificación inicial
    checkTokenValidity()

    // Configurar verificación periódica
    const interval = setInterval(checkTokenValidity, checkInterval * 60 * 1000)

    // Limpiar al desmontar
    return () => clearInterval(interval)
  }, [checkTokenValidity, checkInterval])

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      if (response.status === 401) {
        await performLogout()
      }

      return response
    }

    // Restaurar fetch original al desmontar
    return () => {
      window.fetch = originalFetch
    }
  }, [performLogout])

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout
    const INACTIVITY_TIME = 60 * 60 * 1000 // Aumentado de 30 a 60 minutos de inactividad

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        performLogout()
      }, INACTIVITY_TIME)
    }

    // Eventos que indican actividad del usuario
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true)
    })

    // Inicializar timer
    resetInactivityTimer()

    return () => {
      clearTimeout(inactivityTimer)
      events.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer, true)
      })
    }
  }, [performLogout])

  return {
    checkTokenValidity,
    performLogout,
  }
}
