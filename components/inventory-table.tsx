"use client"

import { useState } from "react"
import type { InventoryItem } from "@/lib/inventory"
import { getWarehouses } from "@/lib/warehouse"

// Tipo para movimientos (compatible con ambos formatos)
type Movement = {
  id: string
  itemId?: string
  item_id?: string
  tipo?: string
  movement_type?: string
  cantidadAnterior?: number
  quantity_before?: number
  cantidadNueva?: number
  quantity_after?: number
  fecha?: string
  created_at?: string
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Search, PackagePlus, CalendarIcon, Filter, X } from "lucide-react"
import { MovementDialog } from "./movement-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { cn } from "@/lib/utils"

interface InventoryTableProps {
  items: InventoryItem[]
  movements?: Movement[]
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void
  onDelete: (id: string) => void
  onMovement: (id: string, cantidad: number, tipo: "entrada" | "salida") => void
  showWarehouse?: boolean // Prop para mostrar columna de bodega
}

export function InventoryTable({ items, movements = [], onUpdate, onDelete, onMovement, showWarehouse = false }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({ codigo: "", nombre: "", cantidadDisponible: 0, precio: 0 })
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null)
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined)
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined)
  const [usarFiltroFechas, setUsarFiltroFechas] = useState(false)

  // Calcular fecha de inicio del mes actual
  const getFechaInicioMes = () => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  }

  // Determinar el rango de fechas a usar
  const fechaInicioCalculada = usarFiltroFechas && fechaInicio ? fechaInicio : getFechaInicioMes()
  const fechaFinCalculada = usarFiltroFechas && fechaFin ? fechaFin : new Date()

  // Filtrar movimientos por rango de fechas (mes actual o filtro personalizado)
  const movimientosFiltrados = movements
    ? movements.filter((mov) => {
        const fechaMov = (mov as any).fecha || (mov as any).created_at
        if (!fechaMov) return false
        const fecha = new Date(fechaMov)
        const fechaMovDate = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
        const inicioDate = new Date(fechaInicioCalculada.getFullYear(), fechaInicioCalculada.getMonth(), fechaInicioCalculada.getDate())
        const finDate = new Date(fechaFinCalculada.getFullYear(), fechaFinCalculada.getMonth(), fechaFinCalculada.getDate())
        return fechaMovDate >= inicioDate && fechaMovDate <= finDate
      })
    : []

  // Calcular cantidad usada en el período para un producto
  const calcularCantidadUsadaPeriodo = (item: InventoryItem) => {
    if (!movements || movements.length === 0) {
      return 0
    }

    // Calcular salidas en el período (mes actual o filtro personalizado)
    const salidasProducto = movimientosFiltrados.filter(
      (mov) => {
        const itemId = (mov as any).itemId || (mov as any).item_id
        const tipo = (mov as any).tipo || (mov as any).movement_type
        return itemId === item.id && tipo === "salida"
      }
    )

    const cantidadTotalSalidas = salidasProducto.reduce((sum, mov) => {
      const cantidadAnterior = (mov as any).cantidadAnterior ?? (mov as any).quantity_before ?? 0
      const cantidadNueva = (mov as any).cantidadNueva ?? (mov as any).quantity_after ?? 0
      const cantidadSalida = Math.max(0, cantidadAnterior - cantidadNueva)
      return sum + cantidadSalida
    }, 0)

    return cantidadTotalSalidas
  }

  // Obtener texto para el encabezado de "Usado"
  const getTextoEncabezadoUsado = () => {
    if (usarFiltroFechas && fechaInicio && fechaFin) {
      return `Usado (${format(fechaInicio, "dd/MM", { locale: es })} - ${format(fechaFin, "dd/MM", { locale: es })})`
    }
    const hoy = new Date()
    const inicioMes = getFechaInicioMes()
    return `Usado (${format(inicioMes, "dd/MM", { locale: es })} - ${format(hoy, "dd/MM", { locale: es })})`
  }

  const filteredItems = items.filter((item) => {
    if (!item || !searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const codigo = item.codigo?.toLowerCase() || ""
    const nombre = item.nombre?.toLowerCase() || ""
    return codigo.includes(searchLower) || nombre.includes(searchLower)
  })

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setEditForm({
      codigo: item.codigo || item.code || "",
      nombre: item.nombre || item.name || "",
      cantidadDisponible: item.cantidadDisponible ?? item.quantity_available ?? 0,
      precio: item.precio ?? item.price ?? 0,
    })
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      onUpdate(editingItem.id, editForm)
      setEditingItem(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filtros de fecha */}
        <div className="flex items-center gap-2">
          <Button
            variant={usarFiltroFechas ? "default" : "outline"}
            size="sm"
            onClick={() => setUsarFiltroFechas(!usarFiltroFechas)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtrar por fecha
          </Button>
          
          {usarFiltroFechas && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !fechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio ? format(fechaInicio, "dd/MM/yyyy", { locale: es }) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !fechaFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFin ? format(fechaFin, "dd/MM/yyyy", { locale: es }) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              
              {(fechaInicio || fechaFin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFechaInicio(undefined)
                    setFechaFin(undefined)
                  }}
                  title="Limpiar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              {showWarehouse && <TableHead>Bodega</TableHead>}
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Precio Unidad</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">{getTextoEncabezadoUsado()}</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showWarehouse ? 8 : 7} className="text-center text-muted-foreground py-8">
                  {searchTerm || usarFiltroFechas ? "No se encontraron resultados" : "No hay productos en el inventario"}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const warehouse = showWarehouse ? getWarehouses().find((w) => w.id === item.warehouseId) : null

                // Asegurar que todos los campos existan
                const codigo = item.codigo || item.code || ""
                const nombre = item.nombre || item.name || ""
                const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0
                const cantidadUsada = calcularCantidadUsadaPeriodo(item)
                const precio = item.precio ?? item.price ?? 0
                const total = cantidadDisponible * precio

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{codigo}</TableCell>
                    <TableCell>{nombre}</TableCell>
                    {showWarehouse && (
                      <TableCell>
                        <Badge variant="outline">{warehouse?.nombre || "Sin bodega"}</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-semibold">{cantidadDisponible.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${typeof precio === 'number' ? precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      ${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {cantidadUsada.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMovementItem(item)}
                          title="Registrar entrada/salida"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica los datos del producto en el inventario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">Código</Label>
              <Input
                id="edit-codigo"
                value={editForm.codigo}
                onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cantidad">Cantidad Disponible</Label>
              <Input
                id="edit-cantidad"
                type="number"
                value={editForm.cantidadDisponible}
                onChange={(e) =>
                  setEditForm({ ...editForm, cantidadDisponible: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-precio">Precio</Label>
              <Input
                id="edit-precio"
                type="number"
                step="0.01"
                value={editForm.precio}
                onChange={(e) => setEditForm({ ...editForm, precio: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MovementDialog item={movementItem} onClose={() => setMovementItem(null)} onMovement={onMovement} />
    </div>
  )
}
