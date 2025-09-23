"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"
import {
  Building2,
  Users,
  FileText,
  MapPin,
  Package,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Wrench,
} from "lucide-react"

interface SidebarProps {
  userRole: "tecnico" | "admin" | "super_admin"
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["tecnico", "admin", "super_admin"],
    },
    {
      title: "Crear Volante",
      href: "/volantes/crear",
      icon: FileText,
      roles: ["tecnico", "admin", "super_admin"],
    },
    {
      title: "Mis Volantes",
      href: "/volantes",
      icon: FileText,
      roles: ["tecnico", "admin", "super_admin"],
    },
    {
      title: "Usuarios",
      href: "/admin/usuarios",
      icon: Users,
      roles: ["admin", "super_admin"],
    },
    {
      title: "Localidades",
      href: "/admin/localidades",
      icon: MapPin,
      roles: ["tecnico", "admin", "super_admin"],
    },
    {
      title: "Equipos",
      href: "/admin/equipos",
      icon: Package,
      roles: ["admin", "super_admin"],
    },
    {
      title: "Tipos de Equipo",
      href: "/admin/tipos-equipo",
      icon: Wrench,
      roles: ["admin", "super_admin"],
    },
    {
      title: "Repuestos",
      href: "/admin/repuestos",
      icon: Package,
      roles: ["admin", "super_admin"],
    },
    {
      title: "Notificaciones",
      href: "/admin/notificaciones",
      icon: Bell,
      roles: ["admin", "super_admin"],
    },
    {
      title: "Configuración",
      href: "/admin/configuracion",
      icon: Settings,
      roles: ["super_admin"],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        {["admin", "super_admin"].includes(userRole) && <NotificationBell />}
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Volantes de Servicio</span>
            </div>
            {["admin", "super_admin"].includes(userRole) && (
              <div className="hidden md:block">
                <NotificationBell />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.title}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
