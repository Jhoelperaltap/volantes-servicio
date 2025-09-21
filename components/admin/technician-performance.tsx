"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, AlertTriangle } from "lucide-react"

interface TechnicianStats {
  id: string
  name: string
  total_tickets: number
  completed_tickets: number
  pending_tickets: number
  avg_resolution_time: number
  completion_rate: number
}

export function TechnicianPerformance() {
  const [technicians, setTechnicians] = useState<TechnicianStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTechnicianStats()
  }, [])

  const fetchTechnicianStats = async () => {
    try {
      const response = await fetch("/api/admin/technician-stats")
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data)
      }
    } catch (error) {
      console.error("Error fetching technician stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceBadge = (completionRate: number) => {
    if (completionRate >= 95) {
      return (
        <Badge variant="default" className="bg-green-500">
          Excelente
        </Badge>
      )
    }
    if (completionRate >= 85) {
      return <Badge variant="secondary">Bueno</Badge>
    }
    return <Badge variant="destructive">Necesita Mejora</Badge>
  }

  if (loading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {technicians.map((tech) => (
        <Card key={tech.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{tech.name}</h3>
                {getPerformanceBadge(tech.completion_rate)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tasa de Completado</span>
                <span className="font-medium">{tech.completion_rate.toFixed(1)}%</span>
              </div>
              <Progress value={tech.completion_rate} className="h-2" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total</div>
                  <div className="font-medium">{tech.total_tickets}</div>
                </div>
                <div>
                  <div className="text-gray-600">Completados</div>
                  <div className="font-medium text-green-600">{tech.completed_tickets}</div>
                </div>
              </div>

              {tech.pending_tickets > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{tech.pending_tickets} pendientes</span>
                </div>
              )}

              <div className="text-sm">
                <span className="text-gray-600">Tiempo promedio: </span>
                <span className="font-medium">{tech.avg_resolution_time.toFixed(1)}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
