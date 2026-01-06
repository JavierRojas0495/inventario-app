"use client"

import { useState } from "react"
import type { InventoryItem } from "@/lib/inventory"
import { getWarehouses } from "@/lib/warehouse"
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
import { Pencil, Trash2, Search, History, PackagePlus } from "lucide-react"
import { ItemHistoryDialog } from "./item-history-dialog"
import { MovementDialog } from "./movement-dialog"

interface InventoryTableProps {
  items: InventoryItem[]
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void
  onDelete: (id: string) => void
  onMovement: (id: string, cantidad: number, tipo: "entrada" | "salida") => void
  showWarehouse?: boolean // Prop para mostrar columna de bodega
}

export function InventoryTable({ items, onUpdate, onDelete, onMovement, showWarehouse = false }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({ codigo: "", nombre: "", cantidadDisponible: 0, precio: 0 })
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null)

  const filteredItems = items.filter(
    (item) =>
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setEditForm({
      codigo: item.codigo,
      nombre: item.nombre,
      cantidadDisponible: item.cantidadDisponible,
      precio: item.precio,
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              {showWarehouse && <TableHead>Bodega</TableHead>}
              <TableHead className="text-right">Inicial</TableHead>
              <TableHead className="text-right">Usado Hoy</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showWarehouse ? 9 : 8} className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No se encontraron resultados" : "No hay productos en el inventario"}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const warehouse = showWarehouse ? getWarehouses().find((w) => w.id === item.warehouseId) : null

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    {showWarehouse && (
                      <TableCell>
                        <Badge variant="outline">{warehouse?.nombre || "Sin bodega"}</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right text-muted-foreground">{item.cantidadInicial}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{item.cantidadUsada}</TableCell>
                    <TableCell className="text-right font-semibold">{item.cantidadDisponible}</TableCell>
                    <TableCell className="text-right">${item.precio.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.fechaActualizacion).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                        <Button variant="ghost" size="sm" onClick={() => setHistoryItem(item)} title="Ver historial">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
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

      <ItemHistoryDialog item={historyItem} onClose={() => setHistoryItem(null)} />
      <MovementDialog item={movementItem} onClose={() => setMovementItem(null)} onMovement={onMovement} />
    </div>
  )
}
