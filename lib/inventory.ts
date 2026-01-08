// Sistema de gestión de inventario con almacenamiento local
export interface InventoryItem {
  id: string
  codigo: string
  nombre: string
  cantidadInicial: number // Con cuánto empecé hoy
  cantidadUsada: number // Cuánto he gastado/vendido hoy
  cantidadDisponible: number // Cuánto me queda
  precio: number
  fechaCreacion: string
  fechaActualizacion: string
  fechaInicioDay: string // Fecha del último inicio de día
  warehouseId: string // Agregado campo warehouseId para identificar la bodega
}

export interface InventoryMovement {
  id: string
  itemId: string
  itemCodigo: string
  itemNombre: string
  tipo: "entrada" | "salida" | "ajuste" | "creacion" | "edicion"
  cantidadAnterior: number
  cantidadNueva: number
  diferencia: number
  fecha: string
  descripcion: string
}

const STORAGE_KEY = "inventory_items"
const MOVEMENTS_KEY = "inventory_movements"

function getStorageKey(key: string, warehouseId: string | null): string {
  if (!warehouseId || warehouseId === "all") return key
  return `${key}_${warehouseId}`
}

export function getAllWarehousesItems(): InventoryItem[] {
  if (typeof window === "undefined") return []

  const { getWarehouses } = require("@/lib/warehouse")
  const warehouses = getWarehouses()
  const allItems: InventoryItem[] = []

  warehouses.forEach((warehouse: any) => {
    const items = getInventoryItems(warehouse.id)
    allItems.push(...items)
  })

  return allItems
}

export function getInventoryItems(warehouseId: string | null = null): InventoryItem[] {
  if (typeof window === "undefined") return []

  if (warehouseId === "all") {
    return getAllWarehousesItems()
  }

  const storageKey = getStorageKey("inventory_items", warehouseId)
  const itemsStr = localStorage.getItem(storageKey)
  if (!itemsStr) return []

  try {
    return JSON.parse(itemsStr)
  } catch {
    return []
  }
}

export function saveInventoryItems(items: InventoryItem[], warehouseId: string | null = null): void {
  const storageKey = getStorageKey("inventory_items", warehouseId)
  localStorage.setItem(storageKey, JSON.stringify(items))
}

export function getInventoryMovements(warehouseId: string | null = null): InventoryMovement[] {
  if (typeof window === "undefined") return []

  const storageKey = getStorageKey("inventory_movements", warehouseId)
  const movementsStr = localStorage.getItem(storageKey)
  if (!movementsStr) return []

  try {
    return JSON.parse(movementsStr)
  } catch {
    return []
  }
}

export function saveInventoryMovements(movements: InventoryMovement[], warehouseId: string | null = null): void {
  const storageKey = getStorageKey("inventory_movements", warehouseId)
  localStorage.setItem(storageKey, JSON.stringify(movements))
}

export function addMovement(
  movement: Omit<InventoryMovement, "id" | "fecha">,
  warehouseId: string | null = null,
): void {
  const movements = getInventoryMovements(warehouseId)
  const newMovement: InventoryMovement = {
    ...movement,
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
  }
  movements.push(newMovement)
  saveInventoryMovements(movements, warehouseId)
}

export function getMovementsByItem(itemId: string, warehouseId: string | null = null): InventoryMovement[] {
  return getInventoryMovements(warehouseId).filter((m) => m.itemId === itemId)
}

export function addInventoryItem(
  item: Omit<
    InventoryItem,
    | "id"
    | "fechaCreacion"
    | "fechaActualizacion"
    | "cantidadInicial"
    | "cantidadUsada"
    | "cantidadDisponible"
    | "fechaInicioDay"
    | "warehouseId"
  >,
  warehouseId: string | null = null,
): InventoryItem {
  if (warehouseId === "all") {
    throw new Error("No se puede agregar producto a 'Todas las bodegas'. Selecciona una bodega específica.")
  }

  const items = getInventoryItems(warehouseId)
  const now = new Date().toISOString()

  const newItem: InventoryItem = {
    ...item,
    id: crypto.randomUUID(),
    warehouseId: warehouseId || "", // Asignar bodega al item
    cantidadInicial: item.cantidad,
    cantidadUsada: 0,
    cantidadDisponible: item.cantidad,
    fechaCreacion: now,
    fechaActualizacion: now,
    fechaInicioDay: now,
  }

  items.push(newItem)
  saveInventoryItems(items, warehouseId)

  addMovement(
    {
      itemId: newItem.id,
      itemCodigo: newItem.codigo,
      itemNombre: newItem.nombre,
      tipo: "creacion",
      cantidadAnterior: 0,
      cantidadNueva: newItem.cantidadDisponible,
      diferencia: newItem.cantidadDisponible,
      descripcion: `Producto creado con stock inicial de ${newItem.cantidadDisponible} unidades`,
    },
    warehouseId,
  )

  return newItem
}

export function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, "id" | "fechaCreacion">>,
  warehouseId: string | null = null,
): boolean {
  const items = getInventoryItems(warehouseId)
  const index = items.findIndex((item) => item.id === id)

  if (index === -1) return false

  const oldItem = items[index]

  const newItem = { ...items[index] }

  if (updates.codigo !== undefined) newItem.codigo = updates.codigo
  if (updates.nombre !== undefined) newItem.nombre = updates.nombre
  if (updates.precio !== undefined) newItem.precio = updates.precio

  // Si se actualiza la cantidad disponible, calcular cuánto se usó
  if (updates.cantidadDisponible !== undefined) {
    const diferencia = oldItem.cantidadDisponible - updates.cantidadDisponible
    newItem.cantidadDisponible = updates.cantidadDisponible
    newItem.cantidadUsada = oldItem.cantidadUsada + diferencia
  }

  newItem.fechaActualizacion = new Date().toISOString()

  items[index] = newItem
  saveInventoryItems(items, warehouseId)

  // Registrar movimiento si cambió la cantidad disponible
  if (updates.cantidadDisponible !== undefined && updates.cantidadDisponible !== oldItem.cantidadDisponible) {
    const diferencia = updates.cantidadDisponible - oldItem.cantidadDisponible
    addMovement(
      {
        itemId: id,
        itemCodigo: newItem.codigo,
        itemNombre: newItem.nombre,
        tipo: diferencia > 0 ? "entrada" : "salida",
        cantidadAnterior: oldItem.cantidadDisponible,
        cantidadNueva: updates.cantidadDisponible,
        diferencia: Math.abs(diferencia),
        descripcion:
          diferencia > 0 ? `Entrada de ${diferencia} unidades` : `Salida de ${Math.abs(diferencia)} unidades`,
      },
      warehouseId,
    )
  } else if (updates.codigo || updates.nombre || updates.precio) {
    addMovement(
      {
        itemId: id,
        itemCodigo: newItem.codigo,
        itemNombre: newItem.nombre,
        tipo: "edicion",
        cantidadAnterior: oldItem.cantidadDisponible,
        cantidadNueva: newItem.cantidadDisponible,
        diferencia: 0,
        descripcion: "Información del producto actualizada",
      },
      warehouseId,
    )
  }

  return true
}

export function deleteInventoryItem(id: string, warehouseId: string | null = null): boolean {
  const items = getInventoryItems(warehouseId)
  const filteredItems = items.filter((item) => item.id !== id)

  if (filteredItems.length === items.length) return false

  saveInventoryItems(filteredItems, warehouseId)
  return true
}

// Función para importar desde CSV/Excel
export function importFromCSV(
  csvText: string,
  warehouseId: string | null = null,
): { success: boolean; count: number; errors: string[] } {
  if (warehouseId === "all") {
    return {
      success: false,
      count: 0,
      errors: ["No se puede importar a 'Todas las bodegas'. Selecciona una bodega específica."],
    }
  }

  const errors: string[] = []
  let count = 0

  try {
    const lines = csvText.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      return { success: false, count: 0, errors: ["Archivo vacío"] }
    }

    const firstLine = lines[0] || ""
    const startIndex = firstLine.toLowerCase().includes("codigo") ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^"|"$/g, ""))

      if (values.length < 4) {
        errors.push(`Línea ${i + 1}: Faltan columnas`)
        continue
      }

      const [codigo, nombre, cantidadStr, precioStr] = values
      const cantidad = Number.parseFloat(cantidadStr)
      const precio = Number.parseFloat(precioStr)

      if (!codigo || !nombre) {
        errors.push(`Línea ${i + 1}: Código o nombre vacío`)
        continue
      }

      if (isNaN(cantidad) || isNaN(precio)) {
        errors.push(`Línea ${i + 1}: Cantidad o precio inválido`)
        continue
      }

      addInventoryItem({ codigo, nombre, cantidad, precio }, warehouseId)
      count++
    }

    return { success: count > 0, count, errors }
  } catch (error) {
    return { success: false, count: 0, errors: [`Error al procesar archivo: ${error}`] }
  }
}

// Función para exportar a CSV
export function exportToCSV(items: InventoryItem[]): string {
  const headers = ["Código", "Nombre", "Bodega", "Inicial", "Usado Hoy", "Disponible", "Precio", "Última Actualización"]
  const rows = items.map((item) => {
    const { getWarehouses } = require("@/lib/warehouse")
    const warehouses = getWarehouses()
    const warehouse = warehouses.find((w: any) => w.id === item.warehouseId)

    return [
      item.codigo,
      item.nombre,
      warehouse?.nombre || "Sin bodega",
      item.cantidadInicial.toString(),
      item.cantidadUsada.toString(),
      item.cantidadDisponible.toString(),
      item.precio.toString(),
      new Date(item.fechaActualizacion).toLocaleString("es-ES"),
    ]
  })

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  return csvContent
}

export function resetDailyInventory(warehouseId: string | null = null): void {
  const items = getInventoryItems(warehouseId)
  const now = new Date().toISOString()

  const updatedItems = items.map((item) => ({
    ...item,
    cantidadInicial: item.cantidadDisponible,
    cantidadUsada: 0,
    fechaInicioDay: now,
  }))

  saveInventoryItems(updatedItems, warehouseId)
}

export function checkAndResetDay(warehouseId: string | null = null): void {
  const items = getInventoryItems(warehouseId)
  if (items.length === 0) return

  const today = new Date().toDateString()
  const lastReset = items[0]?.fechaInicioDay ? new Date(items[0].fechaInicioDay).toDateString() : null

  if (lastReset !== today) {
    resetDailyInventory(warehouseId)
  }
}

// Función para registrar movimientos de entrada/salida
export function registerMovement(
  id: string,
  cantidad: number,
  tipo: "entrada" | "salida",
  warehouseId: string | null = null,
): boolean {
  const items = getInventoryItems(warehouseId)
  const index = items.findIndex((item) => item.id === id)

  if (index === -1) return false

  const oldItem = items[index]
  let nuevaCantidadDisponible = oldItem.cantidadDisponible

  if (tipo === "entrada") {
    // Entrada: aumenta el disponible
    nuevaCantidadDisponible = oldItem.cantidadDisponible + cantidad
  } else {
    // Salida: disminuye el disponible y aumenta el usado
    if (cantidad > oldItem.cantidadDisponible) {
      return false // No se puede sacar más de lo disponible
    }
    nuevaCantidadDisponible = oldItem.cantidadDisponible - cantidad
  }

  const newItem = {
    ...oldItem,
    cantidadDisponible: nuevaCantidadDisponible,
    cantidadUsada: tipo === "salida" ? oldItem.cantidadUsada + cantidad : oldItem.cantidadUsada,
    fechaActualizacion: new Date().toISOString(),
  }

  items[index] = newItem
  saveInventoryItems(items, warehouseId)

  // Registrar el movimiento
  addMovement(
    {
      itemId: id,
      itemCodigo: newItem.codigo,
      itemNombre: newItem.nombre,
      tipo: tipo,
      cantidadAnterior: oldItem.cantidadDisponible,
      cantidadNueva: nuevaCantidadDisponible,
      diferencia: cantidad,
      descripcion: tipo === "entrada" ? `Entrada de ${cantidad} unidades` : `Salida/Uso de ${cantidad} unidades`,
    },
    warehouseId,
  )

  return true
}
