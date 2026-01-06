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
import { getSelectedWarehouseId, getSelectedWarehouse, type Warehouse } from "@/lib/warehouse"
import { LoginForm } from "@/components/login-form"
import { InventoryTable } from "@/components/inventory-table"
import { AddItemForm } from "@/components/add-item-form"
import { CSVImporter } from "@/components/csv-importer"
import { ReportsGenerator } from "@/components/reports-generator"
import { WarehouseSelector } from "@/components/warehouse-selector"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { LogOut, Package, BarChart3, FileText, Building2, Clipboard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      const warehouseId = getSelectedWarehouseId()
      const warehouse = getSelectedWarehouse()
      setSelectedWarehouseId(warehouseId)
      setSelectedWarehouse(warehouse)

      if (warehouseId) {
        if (warehouseId !== "all") {
          checkAndResetDay(warehouseId)
        }
        setItems(getInventoryItems(warehouseId))
      }
    }
  }, [])

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)

    const warehouseId = getSelectedWarehouseId()
    const warehouse = getSelectedWarehouse()
    setSelectedWarehouseId(warehouseId)
    setSelectedWarehouse(warehouse)

    if (warehouseId) {
      setItems(getInventoryItems(warehouseId))
    }

    toast({
      title: "¡Bienvenido!",
      description: `Has iniciado sesión correctamente`,
    })
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setItems([])
    setSelectedWarehouseId(null)
    setSelectedWarehouse(null)
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    })
  }

  const handleWarehouseChange = (warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId)
    setSelectedWarehouse(getSelectedWarehouse())
    if (warehouseId) {
      if (warehouseId !== "all") {
        checkAndResetDay(warehouseId)
      }
      setItems(getInventoryItems(warehouseId))
    } else {
      setItems([])
    }
  }

  const handleAddItem = (
    itemData: { codigo: string; nombre: string; cantidad: number; precio: number },
    warehouseId?: string,
  ) => {
    const targetWarehouseId = warehouseId || selectedWarehouseId

    if (targetWarehouseId === "all") {
      toast({
        title: "Error",
        description: "Debes seleccionar una bodega específica para agregar productos",
        variant: "destructive",
      })
      return
    }

    const newItem = addInventoryItem(itemData, targetWarehouseId)
    setItems(getInventoryItems(selectedWarehouseId))
    toast({
      title: "Producto agregado",
      description: `${itemData.nombre} se agregó al inventario`,
    })
  }

  const handleUpdateItem = (id: string, updates: Partial<InventoryItem>) => {
    const success = updateInventoryItem(id, updates, selectedWarehouseId)
    if (success) {
      setItems(getInventoryItems(selectedWarehouseId))
      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente",
      })
    }
  }

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    const success = deleteInventoryItem(id, selectedWarehouseId)
    if (success) {
      setItems(getInventoryItems(selectedWarehouseId))
      toast({
        title: "Producto eliminado",
        description: `${item?.nombre} se eliminó del inventario`,
      })
    }
  }

  const handleMovement = (id: string, cantidad: number, tipo: "entrada" | "salida") => {
    const item = items.find((i) => i.id === id)
    const success = registerMovement(id, cantidad, tipo, selectedWarehouseId)

    if (success) {
      setItems(getInventoryItems(selectedWarehouseId))
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
    if (selectedWarehouseId === "all") {
      toast({
        title: "Error",
        description: "Debes seleccionar una bodega específica para importar productos",
        variant: "destructive",
      })
      return
    }

    const result = importFromCSV(csvText, selectedWarehouseId)
    setItems(getInventoryItems(selectedWarehouseId))

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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Sistema de Inventario</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <WarehouseSelector onWarehouseChange={handleWarehouseChange} />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {selectedWarehouseId ? (
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
                      <p className="text-sm font-medium text-muted-foreground">Disponible</p>
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

            <Tabs defaultValue="inventario" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="inventario" className="gap-2">
                  <Clipboard className="h-4 w-4" />
                  Inventario
                </TabsTrigger>
                <TabsTrigger value="gestion" className="gap-2">
                  <Package className="h-4 w-4" />
                  Gestión
                </TabsTrigger>
                <TabsTrigger value="informes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Informes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventario" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Inventario Actual</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Consulta productos, registra entradas/salidas y revisa el historial
                  </p>
                </div>
                <InventoryTable
                  items={items}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onMovement={handleMovement}
                  showWarehouse={selectedWarehouseId === "all"}
                />
              </TabsContent>

              <TabsContent value="gestion" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Gestión de Productos</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedWarehouseId === "all"
                      ? "Selecciona la bodega al agregar o importar productos"
                      : "Agrega productos manualmente o importa desde archivo CSV"}
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <AddItemForm onAdd={handleAddItem} currentWarehouseId={selectedWarehouseId} />
                  <CSVImporter onImport={handleImport} />
                </div>
              </TabsContent>

              <TabsContent value="informes" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Generar Informes</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Descarga reportes completos en formato Excel, Word o PDF
                  </p>
                </div>
                <ReportsGenerator items={items} movements={getInventoryMovements(selectedWarehouseId)} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted rounded-full">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Selecciona una bodega</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Para comenzar a gestionar tu inventario, selecciona una bodega existente o crea una nueva desde el
                  selector en la parte superior
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>

      <Toaster />
    </div>
  )
}
