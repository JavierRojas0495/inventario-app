export interface Warehouse {
  id: string
  nombre: string
  ubicacion?: string
  responsable?: string
  telefono?: string
  fechaCreacion: string
}

const WAREHOUSES_KEY = "warehouses"
const SELECTED_WAREHOUSE_KEY = "selected_warehouse"

export function getWarehouses(): Warehouse[] {
  if (typeof window === "undefined") return []

  const warehousesStr = localStorage.getItem(WAREHOUSES_KEY)
  if (!warehousesStr) return []

  try {
    return JSON.parse(warehousesStr)
  } catch {
    return []
  }
}

export function saveWarehouses(warehouses: Warehouse[]): void {
  localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(warehouses))
}

export function addWarehouse(warehouseData: Omit<Warehouse, "id" | "fechaCreacion">): Warehouse {
  const warehouses = getWarehouses()
  const newWarehouse: Warehouse = {
    ...warehouseData,
    id: crypto.randomUUID(),
    fechaCreacion: new Date().toISOString(),
  }

  warehouses.push(newWarehouse)
  saveWarehouses(warehouses)

  // Si es la primera bodega, seleccionarla automáticamente
  if (warehouses.length === 1) {
    setSelectedWarehouse(newWarehouse.id)
  }

  return newWarehouse
}

export function updateWarehouse(id: string, updates: Partial<Omit<Warehouse, "id" | "fechaCreacion">>): boolean {
  const warehouses = getWarehouses()
  const index = warehouses.findIndex((w) => w.id === id)

  if (index === -1) return false

  warehouses[index] = { ...warehouses[index], ...updates }
  saveWarehouses(warehouses)
  return true
}

export function deleteWarehouse(id: string): boolean {
  const warehouses = getWarehouses()
  const filteredWarehouses = warehouses.filter((w) => w.id !== id)

  if (filteredWarehouses.length === warehouses.length) return false

  saveWarehouses(filteredWarehouses)

  // Si se eliminó la bodega seleccionada, limpiar la selección
  if (getSelectedWarehouseId() === id) {
    localStorage.removeItem(SELECTED_WAREHOUSE_KEY)
  }

  return true
}

export function setSelectedWarehouse(warehouseId: string): void {
  localStorage.setItem(SELECTED_WAREHOUSE_KEY, warehouseId)
}

export function getSelectedWarehouseId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SELECTED_WAREHOUSE_KEY)
}

export function getSelectedWarehouse(): Warehouse | null {
  const id = getSelectedWarehouseId()
  if (!id || id === "all") return null

  const warehouses = getWarehouses()
  return warehouses.find((w) => w.id === id) || null
}
