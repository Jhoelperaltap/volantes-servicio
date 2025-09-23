"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, X, ChevronDown } from "lucide-react"

interface SearchFilters {
  q: string
  status: string[]
  serviceType: string[]
  companyId: string
  clientId: string
  locationId: string
  equipmentType: string
  technicianId: string
  dateFrom: string
  dateTo: string
  ticketNumber: string
}

interface SearchOptions {
  companies: Array<{ id: string; name: string }>
  clients: Array<{ id: string; name: string; company_id: string }>
  locations: Array<{ id: string; name: string; client_id: string }>
  technicians: Array<{ id: string; name: string }>
  equipmentTypes: string[]
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  loading?: boolean
}

const SERVICE_TYPES = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "reparacion", label: "Reparación" },
  { value: "instalacion", label: "Instalación" },
  { value: "cambio_repuesto", label: "Cambio Repuesto" },
]

const STATUS_OPTIONS = [
  { value: "completado", label: "Completado" },
  { value: "pendiente", label: "Pendiente" },
  { value: "escalado", label: "Escalado" },
  { value: "seguimiento", label: "Seguimiento" },
]

export function AdvancedSearch({ onSearch, onClear, loading = false }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    status: [],
    serviceType: [],
    companyId: "",
    clientId: "",
    locationId: "",
    equipmentType: "",
    technicianId: "",
    dateFrom: "",
    dateTo: "",
    ticketNumber: "",
  })
  const [options, setOptions] = useState<SearchOptions>({
    companies: [],
    clients: [],
    locations: [],
    technicians: [],
    equipmentTypes: [],
  })

  useEffect(() => {
    fetchSearchOptions()
  }, [])

  const fetchSearchOptions = async () => {
    try {
      const response = await fetch("/api/service-tickets/search-options")
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
      }
    } catch (error) {
      console.error("Error fetching search options:", error)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))

    // Reset dependent filters when parent changes
    if (key === "companyId") {
      setFilters((prev) => ({ ...prev, clientId: "", locationId: "" }))
    } else if (key === "clientId") {
      setFilters((prev) => ({ ...prev, locationId: "" }))
    }
  }

  const handleArrayFilterChange = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value]

    setFilters((prev) => ({
      ...prev,
      [key]: newArray,
    }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleClear = () => {
    setFilters({
      q: "",
      status: [],
      serviceType: [],
      companyId: "",
      clientId: "",
      locationId: "",
      equipmentType: "",
      technicianId: "",
      dateFrom: "",
      dateTo: "",
      ticketNumber: "",
    })
    onClear()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.q) count++
    if (filters.ticketNumber) count++
    if (filters.status.length > 0) count++
    if (filters.serviceType.length > 0) count++
    if (filters.companyId) count++
    if (filters.clientId) count++
    if (filters.locationId) count++
    if (filters.equipmentType) count++
    if (filters.technicianId) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    return count
  }

  const filteredClients = options.clients.filter(
    (client) => !filters.companyId || client.company_id === filters.companyId,
  )

  const filteredLocations = options.locations.filter(
    (location) => !filters.clientId || location.client_id === filters.clientId,
  )

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda Avanzada
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} filtros activos
              </Badge>
            )}
          </CardTitle>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {isOpen ? "Ocultar" : "Mostrar"} Filtros
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CardContent>
        {/* Búsqueda rápida siempre visible */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por descripción, trabajo realizado, equipo, localidad..."
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="# Volante"
              value={filters.ticketNumber}
              onChange={(e) => handleFilterChange("ticketNumber", e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4">
            {/* Filtros de Estado y Tipo de Servicio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Estado</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <Badge
                      key={status.value}
                      variant={filters.status.includes(status.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleArrayFilterChange("status", status.value)}
                    >
                      {status.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Tipo de Servicio</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      variant={filters.serviceType.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleArrayFilterChange("serviceType", type.value)}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtros de Jerarquía */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Select value={filters.companyId} onValueChange={(value) => handleFilterChange("companyId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las empresas</SelectItem>
                    {options.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={filters.clientId}
                  onValueChange={(value) => handleFilterChange("clientId", value)}
                  disabled={!filters.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Localidad</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) => handleFilterChange("locationId", value)}
                  disabled={!filters.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las localidades</SelectItem>
                    {filteredLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                <Select
                  value={filters.equipmentType}
                  onValueChange={(value) => handleFilterChange("equipmentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {options.equipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="technician">Técnico</Label>
                <Select
                  value={filters.technicianId}
                  onValueChange={(value) => handleFilterChange("technicianId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los técnicos</SelectItem>
                    {options.technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="dateFrom">Desde</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="dateTo">Hasta</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
