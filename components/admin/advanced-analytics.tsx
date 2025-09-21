"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
} from "lucide-react"

interface AdvancedAnalytics {
  performanceMetrics: {
    avgResponseTime: number
    firstCallResolution: number
    customerSatisfaction: number
    slaCompliance: number
  }
  locationAnalytics: Array<{
    location: string
    totalTickets: number
    avgResolutionTime: number
    satisfactionScore: number
    criticalIssues: number
  }>
  serviceTypeAnalytics: Array<{
    type: string
    count: number
    avgTime: number
    successRate: number
    trend: "up" | "down" | "stable"
  }>
  monthlyTrends: Array<{
    month: string
    created: number
    completed: number
    pending: number
    escalated: number
  }>
  technicianRanking: Array<{
    name: string
    completedTickets: number
    avgRating: number
    efficiency: number
    specialties: string[]
  }>
  criticalMetrics: {
    overdueTickets: number
    escalatedTickets: number
    repeatIssues: number
    avgFirstResponse: number
  }
}

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    fetchAdvancedAnalytics()
  }, [timeRange])

  const fetchAdvancedAnalytics = async () => {
    try {
      // Simulamos datos para demostración
      const mockData: AdvancedAnalytics = {
        performanceMetrics: {
          avgResponseTime: 45,
          firstCallResolution: 78,
          customerSatisfaction: 87,
          slaCompliance: 92,
        },
        locationAnalytics: [
          {
            location: "Centro",
            totalTickets: 156,
            avgResolutionTime: 2.5,
            satisfactionScore: 88,
            criticalIssues: 3,
          },
          {
            location: "Norte",
            totalTickets: 134,
            avgResolutionTime: 3.2,
            satisfactionScore: 85,
            criticalIssues: 5,
          },
          {
            location: "Sur",
            totalTickets: 98,
            avgResolutionTime: 2.8,
            satisfactionScore: 90,
            criticalIssues: 1,
          },
        ],
        serviceTypeAnalytics: [
          {
            type: "instalacion",
            count: 145,
            avgTime: 2.5,
            successRate: 94,
            trend: "up",
          },
          {
            type: "reparacion",
            count: 189,
            avgTime: 3.2,
            successRate: 87,
            trend: "stable",
          },
          {
            type: "mantenimiento",
            count: 76,
            avgTime: 1.8,
            successRate: 96,
            trend: "up",
          },
        ],
        monthlyTrends: [
          { month: "Ene", created: 120, completed: 115, pending: 5, escalated: 3 },
          { month: "Feb", created: 135, completed: 128, pending: 7, escalated: 4 },
          { month: "Mar", created: 158, completed: 145, pending: 13, escalated: 6 },
          { month: "Abr", created: 142, completed: 138, pending: 4, escalated: 2 },
          { month: "May", created: 167, completed: 159, pending: 8, escalated: 5 },
        ],
        technicianRanking: [
          {
            name: "Carlos Mendoza",
            completedTickets: 89,
            avgRating: 4.8,
            efficiency: 94,
            specialties: ["Instalación", "Reparación"],
          },
          {
            name: "Ana García",
            completedTickets: 76,
            avgRating: 4.6,
            efficiency: 91,
            specialties: ["Mantenimiento", "Diagnóstico"],
          },
          {
            name: "Luis Rodríguez",
            completedTickets: 82,
            avgRating: 4.5,
            efficiency: 88,
            specialties: ["Instalación", "Mantenimiento"],
          },
        ],
        criticalMetrics: {
          overdueTickets: 12,
          escalatedTickets: 8,
          repeatIssues: 15,
          avgFirstResponse: 35,
        },
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error("Error fetching advanced analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (value: number, threshold = 80) => {
    if (value >= threshold) return "text-green-600"
    if (value >= threshold * 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBadge = (value: number, threshold = 80) => {
    if (value >= threshold) return "default"
    if (value >= threshold * 0.7) return "secondary"
    return "destructive"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <div className="h-3 w-3 bg-gray-400 rounded-full" />
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Cargando análisis avanzado...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
        <p>No se pudieron cargar los análisis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas de Rendimiento Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.avgResponseTime}min</div>
            <Progress
              value={Math.min(100, (60 / analytics.performanceMetrics.avgResponseTime) * 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">Objetivo: &lt;60min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolución Primera Llamada</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getPerformanceColor(analytics.performanceMetrics.firstCallResolution)}`}
            >
              {analytics.performanceMetrics.firstCallResolution}%
            </div>
            <Progress value={analytics.performanceMetrics.firstCallResolution} className="mt-2" />
            <Badge variant={getPerformanceBadge(analytics.performanceMetrics.firstCallResolution)} className="mt-2">
              {analytics.performanceMetrics.firstCallResolution >= 80
                ? "Excelente"
                : analytics.performanceMetrics.firstCallResolution >= 60
                  ? "Bueno"
                  : "Necesita mejora"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento SLA</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getPerformanceColor(analytics.performanceMetrics.slaCompliance, 95)}`}
            >
              {analytics.performanceMetrics.slaCompliance}%
            </div>
            <Progress value={analytics.performanceMetrics.slaCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: &gt;95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción Cliente</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getPerformanceColor(analytics.performanceMetrics.customerSatisfaction, 85)}`}
            >
              {analytics.performanceMetrics.customerSatisfaction}%
            </div>
            <Progress value={analytics.performanceMetrics.customerSatisfaction} className="mt-2" />
            <div className="flex items-center mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-3 h-3 ${
                      star <= analytics.performanceMetrics.customerSatisfaction / 20 ? "bg-yellow-400" : "bg-gray-200"
                    } rounded-full mr-1`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {(analytics.performanceMetrics.customerSatisfaction / 20).toFixed(1)}/5
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Críticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Métricas Críticas
          </CardTitle>
          <CardDescription>Indicadores que requieren atención inmediata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analytics.criticalMetrics.overdueTickets}</div>
              <p className="text-sm text-muted-foreground">Tickets Vencidos</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.criticalMetrics.escalatedTickets}</div>
              <p className="text-sm text-muted-foreground">Escalados</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{analytics.criticalMetrics.repeatIssues}</div>
              <p className="text-sm text-muted-foreground">Problemas Recurrentes</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.criticalMetrics.avgFirstResponse}min</div>
              <p className="text-sm text-muted-foreground">Primera Respuesta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis por Localidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rendimiento por Localidad
          </CardTitle>
          <CardDescription>Análisis detallado de cada ubicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.locationAnalytics.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{location.location}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{location.totalTickets} tickets</span>
                    <span>{location.avgResolutionTime}h promedio</span>
                    <span className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-2 h-2 ${
                              star <= location.satisfactionScore / 20 ? "bg-yellow-400" : "bg-gray-200"
                            } rounded-full mr-0.5`}
                          />
                        ))}
                      </div>
                      {(location.satisfactionScore / 20).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {location.criticalIssues > 0 && (
                    <Badge variant="destructive" className="mb-2">
                      {location.criticalIssues} críticos
                    </Badge>
                  )}
                  <div className="text-lg font-bold">
                    {Math.round(
                      (location.totalTickets /
                        analytics.locationAnalytics.reduce((acc, l) => acc + l.totalTickets, 0)) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">del total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análisis por Tipo de Servicio y Tendencia Mensual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Tipo de Servicio</CardTitle>
            <CardDescription>Eficiencia y tendencias por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.serviceTypeAnalytics.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium capitalize">{service.type.replace("_", " ")}</h4>
                      {getTrendIcon(service.trend)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{service.count} tickets</span>
                      <span>{service.avgTime}h promedio</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPerformanceColor(service.successRate)}`}>
                      {service.successRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">éxito</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Evolución de tickets en los últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#8884d8" fill="#8884d8" name="Creados" />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Completados"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Pendientes"
                  />
                  <Area
                    type="monotone"
                    dataKey="escalated"
                    stackId="1"
                    stroke="#ff7300"
                    fill="#ff7300"
                    name="Escalados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking de Técnicos
          </CardTitle>
          <CardDescription>Rendimiento detallado del equipo técnico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.technicianRanking.map((tech, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{tech.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{tech.completedTickets} completados</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-2 h-2 ${
                              star <= tech.avgRating ? "bg-yellow-400" : "bg-gray-200"
                            } rounded-full mr-0.5`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({tech.avgRating.toFixed(1)})</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {tech.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getPerformanceColor(tech.efficiency)}`}>{tech.efficiency}%</div>
                  <p className="text-xs text-muted-foreground">eficiencia</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
