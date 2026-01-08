"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Package, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const [email, setEmail] = useState("admin@admin.com")
  const [password, setPassword] = useState("admin")
  const [username, setUsername] = useState("admin")
  const [fullName, setFullName] = useState("Administrador")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Usar API route para crear el usuario (evita problemas de CORS)
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el usuario")
      }

      // Si el usuario fue creado exitosamente, intentar iniciar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Si no puede iniciar sesión automáticamente, redirigir al login
        setSuccess(true)
        toast({
          title: "Usuario creado exitosamente",
          description: "El usuario administrador ha sido creado. Por favor, inicia sesión.",
        })

        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        // Si el login fue exitoso, redirigir al home
        setSuccess(true)
        toast({
          title: "Usuario creado exitosamente",
          description: "El usuario administrador ha sido creado y has iniciado sesión.",
        })

        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "Error al crear el usuario administrador")
      toast({
        title: "Error",
        description: err.message || "Error al crear el usuario administrador",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Configuración Inicial</h1>
            <p className="text-sm text-muted-foreground">Crea el usuario administrador del sistema</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Crear Usuario Administrador</CardTitle>
              <CardDescription>
                Este será el primer usuario del sistema con permisos de administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">Usuario creado exitosamente</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Redirigiendo a la página de inicio de sesión...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateAdmin}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@admin.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Nombre de Usuario</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="admin"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Administrador"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creando usuario..." : "Crear Usuario Administrador"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
