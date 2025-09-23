"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminStats } from "@/components/admin/admin-stats"
import { RecentTickets } from "@/components/admin/recent-tickets"
import { PendingTickets } from "@/components/admin/pending-tickets"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, TrendingDown, Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface DashboardMetrics {
  completionRate: number
  avgResolutionTime: number
  ticketsByStatus: Array<{ status: string; count: number; percentage: number }>
  ticketsByType: Array<{ type: string; count: number; percentage: number }>
  weeklyTrend: Array<{ day: string; tickets: number; completed: number }>
  technicianStats: Array<{ name: string; completed: number; pending: number; efficiency: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado":
        return "text-green-600"
      case "pendiente":
        return "text-yellow-600"
      case "escalado":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completado":
        return <CheckCircle className="h-4 w-4" />
      case "pendiente":
        return <Clock className="h-4 w-4" />
      case "escalado":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando métricas del dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Resumen ejecutivo y análisis de rendimiento del sistema</p>
        </div>

        {/* Estadísticas principales */}
        <AdminStats />

        {/* Métricas de rendimiento */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.completionRate}%</div>
                <Progress value={metrics.completionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.completionRate >= 80
                    ? "Excelente rendimiento"
                    : metrics.completionRate >= 60
                      ? "Buen rendimiento"
                      : "Necesita mejora"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.avgResolutionTime}h</div>
                <div className="flex items-center mt-2">
                  {metrics.avgResolutionTime <= 4 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrics.avgResolutionTime <= 4 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.avgResolutionTime <= 4 ? "Dentro del objetivo" : "Por encima del objetivo"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia Técnicos</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.technicianStats.length > 0
                    ? Math.round(
                        metrics.technicianStats.reduce((acc, t) => acc + t.efficiency, 0) /
                          metrics.technicianStats.length,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground mt-2">Promedio general</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipos de Servicio</CardTitle>
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.ticketsByType.length}</div>
                <p className="text-xs text-muted-foreground mt-2">Categorías activas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos de análisis */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por Estado */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>Porcentaje de volantes por estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.ticketsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {metrics.ticketsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {metrics.ticketsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {item.status}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Servicio */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Servicio</CardTitle>
                <CardDescription>Distribución de volantes por tipo de servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.ticketsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tendencia semanal */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Semanal</CardTitle>
              <CardDescription>Volantes creados vs completados en los últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tickets" stroke="#8884d8" name="Creados" />
                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completados" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rendimiento de técnicos */}
        {metrics && metrics.technicianStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Técnicos</CardTitle>
              <CardDescription>Eficiencia y productividad por técnico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.technicianStats.map((tech, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{tech.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {tech.completed} completados
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-500" />
                          {tech.pending} pendientes
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{tech.efficiency}%</div>
                      <Badge
                        variant={
                          tech.efficiency >= 80 ? "default" : tech.efficiency >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {tech.efficiency >= 80 ? "Excelente" : tech.efficiency >= 60 ? "Bueno" : "Mejorar"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid de reportes originales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volantes Pendientes</CardTitle>
              <CardDescription>Servicios que requieren seguimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <PendingTickets />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos volantes creados</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTickets />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
