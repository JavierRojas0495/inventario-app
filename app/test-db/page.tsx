"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "checking" | "success" | "error"
  message: string
}

export default function TestDBPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const testResults: TestResult[] = []

    // Test 1: Verificar variables de entorno
    testResults.push({
      name: "Variables de entorno",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    testResults[0] = {
      name: "Variables de entorno",
      status: hasUrl && hasKey ? "success" : "error",
      message: hasUrl && hasKey ? "Variables configuradas correctamente" : "Faltan variables de entorno",
    }
    setResults([...testResults])

    // Test 2: Verificar servicio de autenticación
    testResults.push({
      name: "Servicio de autenticación",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    try {
      const { error: authError } = await supabase.auth.getSession()
      testResults[1] = {
        name: "Servicio de autenticación",
        status: authError ? "error" : "success",
        message: authError ? `Error: ${authError.message}` : "Servicio disponible",
      }
    } catch (error: any) {
      testResults[1] = {
        name: "Servicio de autenticación",
        status: "error",
        message: `Error: ${error.message}`,
      }
    }
    setResults([...testResults])

    // Test 3: Verificar tabla users
    testResults.push({
      name: "Tabla 'users'",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    try {
      const { data, error } = await supabase.from("users").select("id").limit(1)
      testResults[2] = {
        name: "Tabla 'users'",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : "Tabla accesible",
      }
    } catch (error: any) {
      testResults[2] = {
        name: "Tabla 'users'",
        status: "error",
        message: `Error: ${error.message}`,
      }
    }
    setResults([...testResults])

    // Test 4: Verificar tabla warehouses
    testResults.push({
      name: "Tabla 'warehouses'",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    try {
      const { data, error } = await supabase.from("warehouses").select("id").limit(1)
      testResults[3] = {
        name: "Tabla 'warehouses'",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : "Tabla accesible",
      }
    } catch (error: any) {
      testResults[3] = {
        name: "Tabla 'warehouses'",
        status: "error",
        message: `Error: ${error.message}`,
      }
    }
    setResults([...testResults])

    // Test 5: Verificar tabla inventory_items
    testResults.push({
      name: "Tabla 'inventory_items'",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    try {
      const { data, error } = await supabase.from("inventory_items").select("id").limit(1)
      testResults[4] = {
        name: "Tabla 'inventory_items'",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : "Tabla accesible",
      }
    } catch (error: any) {
      testResults[4] = {
        name: "Tabla 'inventory_items'",
        status: "error",
        message: `Error: ${error.message}`,
      }
    }
    setResults([...testResults])

    // Test 6: Verificar tabla inventory_movements
    testResults.push({
      name: "Tabla 'inventory_movements'",
      status: "checking",
      message: "Verificando...",
    })
    setResults([...testResults])

    try {
      const { data, error } = await supabase.from("inventory_movements").select("id").limit(1)
      testResults[5] = {
        name: "Tabla 'inventory_movements'",
        status: error ? "error" : "success",
        message: error ? `Error: ${error.message}` : "Tabla accesible",
      }
    } catch (error: any) {
      testResults[5] = {
        name: "Tabla 'inventory_movements'",
        status: "error",
        message: `Error: ${error.message}`,
      }
    }
    setResults([...testResults])

    setIsLoading(false)
  }

  const successCount = results.filter((r) => r.status === "success").length
  const errorCount = results.filter((r) => r.status === "error").length
  const totalTests = results.length

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Prueba de Conexión a Base de Datos</CardTitle>
            <CardDescription>Verificando conexión con Supabase y acceso a las tablas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && results.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Iniciando pruebas...</span>
              </div>
            )}

            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {result.status === "checking" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  {result.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {result.status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <Badge variant={result.status === "success" ? "default" : result.status === "error" ? "destructive" : "secondary"}>
                  {result.status === "checking" ? "Verificando..." : result.status === "success" ? "✓ OK" : "✗ Error"}
                </Badge>
              </div>
            ))}

            {!isLoading && results.length > 0 && (
              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Resumen</p>
                    <p className="text-sm text-muted-foreground">
                      {successCount} de {totalTests} pruebas exitosas
                    </p>
                  </div>
                  <Badge variant={errorCount === 0 ? "default" : "destructive"} className="text-lg">
                    {errorCount === 0 ? "✅ Conexión Exitosa" : "⚠️ Errores Detectados"}
                  </Badge>
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={testConnection}
                className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Ejecutar Pruebas Nuevamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
