"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, MapPin, Wrench, Plus, Edit, Trash2, ChevronRight, Phone, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CompanyFormDialog } from "./company-form-dialog"
import { ClientFormDialog } from "./client-form-dialog"
import { LocationFormDialog } from "./location-form-dialog"
import { EquipmentFormDialog } from "./equipment-form-dialog"

interface Company {
  id: string
  name: string
  description?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
  created_at: string
  clients_count?: number
}

interface Client {
  id: string
  company_id: string
  company_name: string
  name: string
  description?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
  created_at: string
  locations_count?: number
}

interface Location {
  id: string
  client_id: string
  client_name: string
  company_name: string
  name: string
  address?: string
  city?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
  created_at: string
  equipment_count?: number
}

interface Equipment {
  id: string
  location_id: string
  location_name: string
  client_name: string
  company_name: string
  name: string
  model?: string
  serial_number?: string
  brand?: string
  equipment_type?: string
  description?: string
  is_active: boolean
  created_at: string
}

interface HierarchyManagementProps {
  defaultTab?: string
}

export function HierarchyManagement({ defaultTab = "companies" }: HierarchyManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState(defaultTab)

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [companiesRes, clientsRes, locationsRes, equipmentRes] = await Promise.all([
        fetch("/api/admin/companies"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/locations-new"),
        fetch("/api/admin/equipment"),
      ])

      if (companiesRes.ok) setCompanies(await companiesRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (locationsRes.ok) setLocations(await locationsRes.json())
      if (equipmentRes.ok) setEquipment(await equipmentRes.json())
    } catch (error) {
      setError("Error cargando datos")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (type: string, id: string) => {
    if (!confirm(`¿Está seguro de eliminar este ${type}?`)) return

    try {
      const response = await fetch(`/api/admin/${type}/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchAllData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Error eliminando ${type}`)
      }
    } catch (error) {
      setError(`Error eliminando ${type}`)
    }
  }

  const handleNewCompany = () => {
    setEditingCompany(null)
    setCompanyDialogOpen(true)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyDialogOpen(true)
  }

  const handleCompanySuccess = () => {
    fetchAllData()
    setError("")
  }

  const handleNewClient = () => {
    setEditingClient(null)
    setClientDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientDialogOpen(true)
  }

  const handleClientSuccess = () => {
    fetchAllData()
    setError("")
  }

  const handleNewLocation = () => {
    setEditingLocation(null)
    setLocationDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setLocationDialogOpen(true)
  }

  const handleLocationSuccess = () => {
    fetchAllData()
    setError("")
  }

  const handleNewEquipment = () => {
    setEditingEquipment(null)
    setEquipmentDialogOpen(true)
  }

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setEquipmentDialogOpen(true)
  }

  const handleEquipmentSuccess = () => {
    fetchAllData()
    setError("")
  }

  if (loading) {
    return <div className="text-center py-8">Cargando estructura jerárquica...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Empresas ({companies.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localidades ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Equipos ({equipment.length})
          </TabsTrigger>
        </TabsList>

        {/* EMPRESAS */}
        <TabsContent value="companies" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Empresas</h3>
              <p className="text-sm text-gray-600">Empresas que reciben servicios técnicos</p>
            </div>
            <Button onClick={handleNewCompany}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
          </div>

          <div className="grid gap-4">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        {company.description && <CardDescription>{company.description}</CardDescription>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEditCompany(company)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("companies", company.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {company.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{company.address}</span>
                      </div>
                    )}
                    {company.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{company.contact_person}</span>
                      </div>
                    )}
                    {company.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{company.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Clientes: {company.clients_count || 0}</span>
                      <span>Creada: {new Date(company.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CLIENTES */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Clientes</h3>
              <p className="text-sm text-gray-600">Clientes de las empresas</p>
            </div>
            <Button onClick={handleNewClient}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>

          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {client.company_name}
                          <ChevronRight className="w-3 h-3" />
                          {client.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("clients", client.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {client.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{client.contact_person}</span>
                      </div>
                    )}
                    {client.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{client.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Localidades: {client.locations_count || 0}</span>
                      <span>Creado: {new Date(client.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LOCALIDADES */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Localidades</h3>
              <p className="text-sm text-gray-600">Ubicaciones físicas de los clientes</p>
            </div>
            <Button onClick={handleNewLocation}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Localidad
            </Button>
          </div>

          <div className="grid gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <div>
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {location.company_name}
                          <ChevronRight className="w-3 h-3" />
                          {location.client_name}
                          <ChevronRight className="w-3 h-3" />
                          {location.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={location.is_active ? "default" : "secondary"}>
                        {location.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEditLocation(location)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("locations-new", location.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {location.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{location.address}</span>
                      </div>
                    )}
                    {location.city && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Ciudad:</span>
                        <span>{location.city}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Equipos: {location.equipment_count || 0}</span>
                      <span>Creada: {new Date(location.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* EQUIPOS */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Equipos</h3>
              <p className="text-sm text-gray-600">Equipos instalados en las localidades</p>
            </div>
            <Button onClick={handleNewEquipment}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Equipo
            </Button>
          </div>

          <div className="grid gap-4">
            {equipment.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {item.company_name}
                          <ChevronRight className="w-3 h-3" />
                          {item.client_name}
                          <ChevronRight className="w-3 h-3" />
                          {item.location_name}
                          <ChevronRight className="w-3 h-3" />
                          {item.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEquipment(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("equipment", item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {item.model && (
                      <div>
                        <span className="font-medium">Modelo:</span> {item.model}
                      </div>
                    )}
                    {item.brand && (
                      <div>
                        <span className="font-medium">Marca:</span> {item.brand}
                      </div>
                    )}
                    {item.serial_number && (
                      <div>
                        <span className="font-medium">Serie:</span> {item.serial_number}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Tipo: {item.equipment_type || "General"}</span>
                      <span>Creado: {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CompanyFormDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        company={editingCompany}
        onSuccess={handleCompanySuccess}
      />

      <ClientFormDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        client={editingClient}
        onSuccess={handleClientSuccess}
      />

      <LocationFormDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        location={editingLocation}
        onSuccess={handleLocationSuccess}
      />

      <EquipmentFormDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        equipment={editingEquipment}
        onSuccess={handleEquipmentSuccess}
      />
    </div>
  )
}
