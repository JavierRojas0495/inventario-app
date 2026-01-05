"use client"

import { useEffect, useState } from "react"
import { getCurrentUser, logout, type User } from "@/lib/auth"
import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  importFromCSV,
  getInventoryMovements,
  checkAndResetDay,
  registerMovement,
  type InventoryItem,
} from "@/lib/inventory"
import { LoginForm } from "@/components/login-form"
import { InventoryTable } from "@/components/inventory-table"
import { AddItemForm } from "@/components/add-item-form"
import { CSVImporter } from "@/components/csv-importer"
import { ReportsGenerator } from "@/components/reports-generator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { LogOut, Package, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      checkAndResetDay()
      setItems(getInventoryItems())
    }
  }, [])

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setItems(getInventoryItems())
    toast({
      title: "¡Bienvenido!",
      description: `Has iniciado sesión correctamente`,
    })
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setItems([])
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    })
  }

  const handleAddItem = (itemData: { codigo: string; nombre: string; cantidad: number; precio: number }) => {
    const newItem = addInventoryItem(itemData)
    setItems(getInventoryItems())
    toast({
      title: "Producto agregado",
      description: `${itemData.nombre} se agregó al inventario`,
    })
  }

  const handleUpdateItem = (id: string, updates: Partial<InventoryItem>) => {
    const success = updateInventoryItem(id, updates)
    if (success) {
      setItems(getInventoryItems())
      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente",
      })
    }
  }

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    const success = deleteInventoryItem(id)
    if (success) {
      setItems(getInventoryItems())
      toast({
        title: "Producto eliminado",
        description: `${item?.nombre} se eliminó del inventario`,
      })
    }
  }

  const handleMovement = (id: string, cantidad: number, tipo: "entrada" | "salida") => {
    const item = items.find((i) => i.id === id)
    const success = registerMovement(id, cantidad, tipo)

    if (success) {
      setItems(getInventoryItems())
      toast({
        title: tipo === "entrada" ? "Entrada registrada" : "Salida registrada",
        description: `${cantidad} unidades de ${item?.nombre} ${tipo === "entrada" ? "agregadas" : "retiradas"}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento. Verifica el stock disponible.",
        variant: "destructive",
      })
    }
  }

  const handleImport = (csvText: string) => {
    const result = importFromCSV(csvText)
    setItems(getInventoryItems())

    if (result.success) {
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${result.count} productos`,
      })
    } else {
      toast({
        title: "Error en importación",
        description: result.errors[0] || "No se pudieron importar los datos",
        variant: "destructive",
      })
    }

    if (result.errors.length > 0 && result.count > 0) {
      console.log("Errores durante la importación:", result.errors)
    }
  }

  if (!mounted) {
    return null
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  const totalProductos = items.length
  const totalUnidades = items.reduce((sum, item) => sum + item.cantidadDisponible, 0)
  const totalUsado = items.reduce((sum, item) => sum + item.cantidadUsada, 0)
  const valorTotal = items.reduce((sum, item) => sum + item.cantidadDisponible * item.precio, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-balance">Sistema de Inventario</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Gestiona tus productos fácilmente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                    <p className="text-2xl font-bold">{totalProductos}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unidades Disponibles</p>
                    <p className="text-2xl font-bold text-primary">{totalUnidades}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Usado Hoy</p>
                    <p className="text-2xl font-bold text-destructive">{totalUsado}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-destructive/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">${valorTotal.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AddItemForm onAdd={handleAddItem} />
            </div>
            <CSVImporter onImport={handleImport} />
          </div>

          <ReportsGenerator items={items} movements={getInventoryMovements()} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Inventario Actual</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona entradas, salidas y consulta el historial de cada producto
                </p>
              </div>
            </div>
            <InventoryTable
              items={items}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onMovement={handleMovement}
            />
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
