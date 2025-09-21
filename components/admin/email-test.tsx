"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Mail, Settings } from "lucide-react"

interface TestResult {
  success: boolean
  message?: string
  error?: string
  messageId?: string
  recipient?: string
  details?: string
}

export function EmailTest() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [recipient, setRecipient] = useState("")

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "connection" }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: "Error de conexión" })
    } finally {
      setTesting(false)
    }
  }

  const sendTestEmail = async () => {
    if (!recipient) {
      setTestResult({ success: false, error: "Ingresa un email de destino" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "send", recipient }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: "Error enviando email de prueba" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Prueba de Configuración de Email
        </CardTitle>
        <CardDescription>Verifica que la configuración SMTP esté funcionando correctamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prueba de conexión */}
        <div className="space-y-2">
          <Button onClick={testConnection} disabled={testing} variant="outline" className="w-full bg-transparent">
            <Settings className="h-4 w-4 mr-2" />
            {testing ? "Probando conexión..." : "Probar Conexión SMTP"}
          </Button>
        </div>

        {/* Envío de email de prueba */}
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="email@ejemplo.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Button onClick={sendTestEmail} disabled={testing || !recipient} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            {testing ? "Enviando..." : "Enviar Email de Prueba"}
          </Button>
        </div>

        {/* Resultado */}
        {testResult && (
          <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                {testResult.success ? (
                  <div>
                    <div className="font-medium">✅ {testResult.message}</div>
                    {testResult.messageId && <div className="text-sm mt-1">ID: {testResult.messageId}</div>}
                    {testResult.recipient && <div className="text-sm mt-1">Enviado a: {testResult.recipient}</div>}
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">❌ {testResult.error}</div>
                    {testResult.details && <div className="text-sm mt-1">Detalles: {testResult.details}</div>}
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Información de configuración */}
        <div className="text-sm text-gray-600 space-y-1">
          <div className="font-medium">Variables de entorno requeridas:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>SMTP_HOST (ej: smtp.gmail.com)</li>
            <li>SMTP_PORT (ej: 587)</li>
            <li>SMTP_USER (tu email)</li>
            <li>SMTP_PASS (contraseña de aplicación)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
