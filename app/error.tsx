"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Error de Aplicación</CardTitle>
          </div>
          <CardDescription>Ocurrió un error inesperado en la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-2">Detalles del error:</p>
            <p className="text-sm text-muted-foreground">{error.message || "Error desconocido"}</p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">ID: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Intentar de nuevo
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="flex-1"
            >
              Ir al inicio
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Si el problema persiste, verifica la consola del navegador para más detalles.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
