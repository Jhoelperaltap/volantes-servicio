"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Wrench, MapPin, AlertTriangle, Package, Search, Clock, CheckCircle } from "lucide-react"

interface AdvancedStats {
  equipmentStats: Array<{
    equipmentType: string
    brand: string
    model: string
    totalServices: number
    maintenanceCount: number
    repairCount: number
    installationCount: number
    inspectionCount: number
  }>
  locationVisits: Array<{
    locationName: string
    clientName: string
    companyName: string
    totalVisits: number
    completedVisits: number
    pendingVisits: number
    avgResolutionHours: number
  }>
  locationsPending: Array<{
    locationName: string
    clientName: string
    companyName: string
    pendingCount: number
    returnRequired: number
    escalatedCount: number
    lastPendingDate: string
  }>
  partsUsage: Array<{
    partName: string
    partNumber: string
    category: string
    brand: string
    usageCount: number
    totalQuantityUsed: number
    avgQuantityPerService: number
    totalCost: number
    locationsUsed: number
    techniciansUsed: number
  }>
  serviceTypesTrend: Array<{
    month: string
    serviceType: string
    count: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function AdvancedDashboardStats() {
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAdvancedStats()
  }, [])

  const fetchAdvancedStats = async () => {
    try {
      const response = await fetch("/api/admin/advanced-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching advanced stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredParts =
    stats?.partsUsage.filter(
      (part) =>
        part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  if (loading) {
    return <div className="text-center py-8">Cargando estadísticas avanzadas...</div>
  }

  if (!stats) {
    return <div className="text-center py-8">Error al cargar estadísticas avanzadas</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipos con Más Servicios
          </CardTitle>
          <CardDescription>Equipos que requieren más atención por tipo de servicio (últimos 90 días)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.equipmentStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipmentType" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name]} labelFormatter={(label) => `Equipo: ${label}`} />
                <Bar dataKey="maintenanceCount" stackId="a" fill="#0088FE" name="Mantenimiento" />
                <Bar dataKey="repairCount" stackId="a" fill="#00C49F" name="Reparación" />
                <Bar dataKey="installationCount" stackId="a" fill="#FFBB28" name="Instalación" />
                <Bar dataKey="inspectionCount" stackId="a" fill="#FF8042" name="Revisión" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.equipmentStats.slice(0, 4).map((equipment, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-sm">{equipment.equipmentType}</div>
                <div className="text-xs text-gray-600">
                  {equipment.brand} {equipment.model}
                </div>
                <div className="text-lg font-bold text-blue-600">{equipment.totalServices}</div>
                <div className="text-xs text-gray-500">servicios</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localidades con Más Visitas
            </CardTitle>
            <CardDescription>Ubicaciones que requieren más servicios técnicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.locationVisits.slice(0, 10).map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{location.locationName}</div>
                    <div className="text-sm text-gray-600">
                      {location.clientName} - {location.companyName}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {location.completedVisits} completadas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-yellow-500" />
                        {location.pendingVisits} pendientes
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{location.totalVisits}</div>
                    <div className="text-xs text-gray-500">visitas</div>
                    {location.avgResolutionHours > 0 && (
                      <div className="text-xs text-gray-400">{location.avgResolutionHours}h promedio</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Localidades con Más Pendientes
            </CardTitle>
            <CardDescription>Ubicaciones que requieren seguimiento urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.locationsPending.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-red-100">
                  <div className="flex-1">
                    <div className="font-medium">{location.locationName}</div>
                    <div className="text-sm text-gray-600">
                      {location.clientName} - {location.companyName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {location.returnRequired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {location.returnRequired} requieren retorno
                        </Badge>
                      )}
                      {location.escalatedCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {location.escalatedCount} escalados
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{location.pendingCount}</div>
                    <div className="text-xs text-gray-500">pendientes</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Repuestos Más Utilizados
          </CardTitle>
          <CardDescription>Análisis de consumo de repuestos y partes (últimos 90 días)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar repuestos por nombre, número de parte o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredParts.slice(0, 12).map((part, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{part.partName}</div>
                    <div className="text-xs text-gray-600">
                      {part.partNumber} - {part.category}
                    </div>
                    <div className="text-xs text-gray-500">{part.brand}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {part.usageCount} usos
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Cantidad total:</span>
                    <span className="font-medium">{part.totalQuantityUsed}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Promedio por servicio:</span>
                    <span className="font-medium">{part.avgQuantityPerService.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Costo total:</span>
                    <span className="font-medium text-green-600">${part.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Localidades:</span>
                    <span className="font-medium">{part.locationsUsed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredParts.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron repuestos que coincidan con "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
