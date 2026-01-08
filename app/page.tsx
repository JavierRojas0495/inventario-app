"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { InventoryTable } from "@/components/inventory-table"
import { AddItemForm } from "@/components/add-item-form"
import { CSVImporter } from "@/components/csv-importer"
import { ReportsGenerator } from "@/components/reports-generator"
import { WarehouseSelector } from "@/components/warehouse-selector"
import { UserManagement } from "@/components/user-management"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { LogOut, Package, BarChart3, FileText, Building2, Clipboard, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InventoryItem {
  id: string
  warehouse_id: string
  warehouse_name?: string
  code: string
  name: string
  price: number
  quantity_available: number
  quantity_initial_today: number
  quantity_used_today: number
  updated_at: string
}

interface Movement {
  id: string
  item_id: string
  warehouse_id: string
  movement_type: string
  quantity_before: number
  quantity_change: number
  quantity_after: number
  description: string
  created_at: string
}

export default function Home() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  // Crear cliente de Supabase con manejo de errores
  let supabase
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error("Error al inicializar Supabase:", err)
    // Si hay error, mostrar mensaje pero continuar (el error se mostrará en el componente)
  }

  useEffect(() => {
    if (!supabase) {
      const errorMsg = "Error de configuración: No se pudo conectar con la base de datos. Por favor, verifica las variables de entorno."
      setError(errorMsg)
      setIsLoading(false)
      toast({
        title: "Error de configuración",
        description: "No se pudo conectar con la base de datos. Por favor, recarga la página.",
        variant: "destructive",
      })
      return
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (selectedWarehouseId) {
      loadItems()
      loadMovements()
      resetDailyQuantities()
    }
  }, [selectedWarehouseId])

  const loadUser = async () => {
    if (!supabase) return
    
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Error de autenticación:", authError)
        setError("Error de autenticación. Por favor, inicia sesión nuevamente.")
        router.push("/auth/login")
        return
      }
      
      if (user) {
        const { data, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()
        if (userError) {
          console.error("Error al cargar usuario:", userError)
        }
        setCurrentUser(data)
      }
    } catch (err: any) {
      console.error("Error inesperado al cargar usuario:", err)
      setError(err.message || "Error al cargar información del usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const loadItems = async () => {
    if (!selectedWarehouseId) return

    let query = supabase.from("inventory_items").select(`
        *,
        warehouses:warehouse_id (
          name
        )
      `)

    if (selectedWarehouseId !== "all") {
      query = query.eq("warehouse_id", selectedWarehouseId)
    }

    const { data, error } = await query.order("name")

      if (data) {
        const formattedItems = data.map((item: any) => ({
          ...item,
          warehouse_name: item.warehouses?.name || "",
          // Mapear campos de Supabase a formato esperado por componentes
          codigo: item.code || item.codigo || "",
          nombre: item.name || item.nombre || "",
          cantidadDisponible: item.quantity_available || item.cantidadDisponible || 0,
          cantidadInicial: item.quantity_initial_today || item.cantidadInicial || 0,
          cantidadUsada: item.quantity_used_today || item.cantidadUsada || 0,
          precio: item.price || item.precio || 0,
          fechaActualizacion: item.updated_at || item.fechaActualizacion || item.created_at || new Date().toISOString(),
          warehouseId: item.warehouse_id || item.warehouseId || "",
        }))
        setItems(formattedItems)
      }
  }

  const loadMovements = async () => {
    if (!selectedWarehouseId || !supabase) return

    try {
      let query = supabase.from("inventory_movements").select("*")

      if (selectedWarehouseId !== "all") {
        query = query.eq("warehouse_id", selectedWarehouseId)
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(100)

      if (error) {
        console.error("Error al cargar movimientos:", error)
        return
      }

      if (data) {
        setMovements(data)
      }
    } catch (err: any) {
      console.error("Error inesperado al cargar movimientos:", err)
    }
  }

  const resetDailyQuantities = async () => {
    if (!supabase) return
    try {
      // Llamar a la función SQL que resetea las cantidades diarias
      await supabase.rpc("reset_daily_quantities")
      await loadItems()
    } catch (err: any) {
      console.error("Error al resetear cantidades diarias:", err)
      // Continuar aunque falle el reset
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const handleWarehouseChange = (warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId)
  }

  const handleAddItem = async (
    itemData: { codigo: string; nombre: string; cantidad: number; precio: number },
    warehouseId?: string,
  ) => {
    try {
      const targetWarehouseId = warehouseId || selectedWarehouseId

      if (!targetWarehouseId || targetWarehouseId === "all") {
        toast({
          title: "Error",
          description: "Debes seleccionar una bodega específica para agregar productos",
          variant: "destructive",
        })
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("inventory_items")
        .insert([
          {
            warehouse_id: targetWarehouseId,
            code: itemData.codigo,
            name: itemData.nombre,
            price: itemData.precio,
            quantity_available: itemData.cantidad,
            quantity_initial_today: itemData.cantidad,
            quantity_used_today: 0,
            created_by: userData.user.id,
          },
        ])
        .select()

      if (error) {
        console.error("Error al crear producto:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el producto. Verifica los datos e intenta nuevamente.",
          variant: "destructive",
        })
        return
      }

      if (!data || !data[0]) {
        toast({
          title: "Error",
          description: "El producto se creó pero no se pudo obtener la información. Por favor, recarga la página.",
          variant: "destructive",
        })
        await loadItems()
        return
      }

      // Registrar movimiento de creación
      try {
        const { error: movementError } = await supabase.from("inventory_movements").insert([
          {
            item_id: data[0].id,
            warehouse_id: targetWarehouseId,
            movement_type: "creacion",
            quantity_before: 0,
            quantity_change: itemData.cantidad,
            quantity_after: itemData.cantidad,
            description: `Producto creado: ${itemData.nombre}`,
            created_by: userData.user.id,
          },
        ])

        if (movementError) {
          console.error("Error al registrar movimiento:", movementError)
          // No bloqueamos el flujo si falla el movimiento, solo lo registramos
        }
      } catch (movementErr) {
        console.error("Error al registrar movimiento:", movementErr)
        // Continuamos aunque falle el movimiento
      }

      await loadItems()
      toast({
        title: "Producto agregado",
        description: `${itemData.nombre} se agregó al inventario`,
      })
    } catch (error: any) {
      console.error("Error inesperado al agregar producto:", error)
      toast({
        title: "Error inesperado",
        description: error.message || "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const { data: userData } = await supabase.auth.getUser()

    // Obtener el item antes de actualizar
    const { data: oldItem } = await supabase.from("inventory_items").select("*").eq("id", id).single()

    const { error } = await supabase.from("inventory_items").update(updates).eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    // Registrar movimiento de edición
    if (oldItem) {
      await supabase.from("inventory_movements").insert([
        {
          item_id: id,
          warehouse_id: oldItem.warehouse_id,
          movement_type: "edicion",
          quantity_before: oldItem.quantity_available,
          quantity_change: 0,
          quantity_after: updates.quantity_available || oldItem.quantity_available,
          description: `Producto editado`,
          created_by: userData.user?.id,
        },
      ])
    }

    await loadItems()
    toast({
      title: "Producto actualizado",
      description: "Los cambios se guardaron correctamente",
    })
  }

  const handleDeleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id)

    const { error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    await loadItems()
    toast({
      title: "Producto eliminado",
      description: `${item?.name} se eliminó del inventario`,
    })
  }

  const handleMovement = async (id: string, cantidad: number, tipo: "entrada" | "salida") => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const { data: userData } = await supabase.auth.getUser()

    let newQuantity = item.quantity_available
    let newUsedToday = item.quantity_used_today

    if (tipo === "entrada") {
      newQuantity += cantidad
    } else {
      if (cantidad > item.quantity_available) {
        toast({
          title: "Error",
          description: "No hay suficiente stock disponible",
          variant: "destructive",
        })
        return
      }
      newQuantity -= cantidad
      newUsedToday += cantidad
    }

    const { error } = await supabase
      .from("inventory_items")
      .update({
        quantity_available: newQuantity,
        quantity_used_today: newUsedToday,
      })
      .eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    // Registrar movimiento
    await supabase.from("inventory_movements").insert([
      {
        item_id: id,
        warehouse_id: item.warehouse_id,
        movement_type: tipo,
        quantity_before: item.quantity_available,
        quantity_change: tipo === "entrada" ? cantidad : -cantidad,
        quantity_after: newQuantity,
        description: `${tipo === "entrada" ? "Entrada" : "Salida"} de ${cantidad} unidades`,
        created_by: userData.user?.id,
      },
    ])

    await loadItems()
    await loadMovements()

    toast({
      title: tipo === "entrada" ? "Entrada registrada" : "Salida registrada",
      description: `${cantidad} unidades de ${item.name} ${tipo === "entrada" ? "agregadas" : "retiradas"}`,
    })
  }

  const handleImport = async (csvText: string) => {
    if (selectedWarehouseId === "all") {
      toast({
        title: "Error",
        description: "Debes seleccionar una bodega específica para importar productos",
        variant: "destructive",
      })
      return
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "No se pudo conectar con la base de datos",
        variant: "destructive",
      })
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    const lines = csvText.trim().split("\n").filter((line) => line.trim())
    
    if (lines.length === 0) {
      toast({
        title: "Error",
        description: "El archivo CSV está vacío",
        variant: "destructive",
      })
      return
    }

    const headers = lines[0]?.toLowerCase() || ""

    if (
      !headers ||
      !headers.includes("codigo") ||
      !headers.includes("nombre") ||
      !headers.includes("cantidad") ||
      !headers.includes("precio")
    ) {
      toast({
        title: "Error en el formato",
        description: "El archivo CSV debe tener las columnas: Codigo, Nombre, Cantidad, Precio",
        variant: "destructive",
      })
      return
    }

    let successCount = 0
    let errorCount = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(",").map((v) => v.trim())
      const [codigo, nombre, cantidad, precio] = values

      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .insert([
            {
              warehouse_id: selectedWarehouseId,
              code: codigo,
              name: nombre,
              price: Number.parseFloat(precio),
              quantity_available: Number.parseInt(cantidad),
              quantity_initial_today: Number.parseInt(cantidad),
              quantity_used_today: 0,
              created_by: userData.user?.id,
            },
          ])
          .select()

        if (error) throw error

        // Registrar movimiento
        if (data && data[0]) {
          await supabase.from("inventory_movements").insert([
            {
              item_id: data[0].id,
              warehouse_id: selectedWarehouseId,
              movement_type: "creacion",
              quantity_before: 0,
              quantity_change: Number.parseInt(cantidad),
              quantity_after: Number.parseInt(cantidad),
              description: `Producto importado: ${nombre}`,
              created_by: userData.user?.id,
            },
          ])
        }

        successCount++
      } catch (err) {
        errorCount++
      }
    }

    await loadItems()

    if (successCount > 0) {
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${successCount} productos${errorCount > 0 ? ` (${errorCount} errores)` : ""}`,
      })
    } else {
      toast({
        title: "Error en importación",
        description: "No se pudieron importar los productos",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const totalProductos = items.length
  const totalUnidades = items.reduce((sum, item) => sum + item.quantity_available, 0)
  const totalUsado = items.reduce((sum, item) => sum + item.quantity_used_today, 0)
  const valorTotal = items.reduce((sum, item) => sum + item.quantity_available * item.price, 0)

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
                {currentUser && (
                  <p className="text-xs text-muted-foreground">
                    {currentUser.full_name} {currentUser.is_admin && "• Admin"}
                  </p>
                )}
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
              <TabsList
                className={`grid w-full ${currentUser?.is_admin ? "grid-cols-4" : "grid-cols-3"} lg:w-auto lg:inline-grid`}
              >
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
                {currentUser?.is_admin && (
                  <TabsTrigger value="usuarios" className="gap-2">
                    <Users className="h-4 w-4" />
                    Usuarios
                  </TabsTrigger>
                )}
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
                <ReportsGenerator items={items} movements={movements} />
              </TabsContent>

              {currentUser?.is_admin && (
                <TabsContent value="usuarios" className="space-y-4">
                  <UserManagement />
                </TabsContent>
              )}
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
