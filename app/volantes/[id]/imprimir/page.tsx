"use client"

import { useEffect } from "react"
import { PrintableTicket } from "@/components/volantes/printable-ticket"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { use } from "react"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function PrintTicketPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Auto-abrir diálogo de impresión después de cargar
    const timer = setTimeout(() => {
      window.print()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    // Try to go back in history first
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to volante detail page
      router.push(`/volantes/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Controles de impresión - ocultos en impresión */}
      <div className="print:hidden sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Contenido imprimible */}
      <div className="p-4 print:p-0">
        <PrintableTicket ticketId={id} />
      </div>
    </div>
  )
}
