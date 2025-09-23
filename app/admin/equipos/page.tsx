import { HierarchyManagement } from "@/components/admin/hierarchy-management"

export default function EquiposPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Administración de Equipos</h1>
        <p className="text-gray-600 mt-2">Gestiona todos los equipos del sistema de manera centralizada</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <HierarchyManagement defaultTab="equipment" />
      </div>
    </div>
  )
}
