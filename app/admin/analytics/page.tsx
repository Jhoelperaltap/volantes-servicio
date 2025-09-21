"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdvancedAnalytics } from "@/components/admin/advanced-analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    // Simular refresh
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Implementar exportación de datos
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Análisis Avanzado
            </h1>
            <p className="text-gray-600">Métricas detalladas y análisis de rendimiento del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="90d">90 días</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Panel de Análisis Integral</CardTitle>
            <CardDescription>
              Visualización completa del rendimiento operacional, métricas de calidad y análisis predictivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedAnalytics />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
