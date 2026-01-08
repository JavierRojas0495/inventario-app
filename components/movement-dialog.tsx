"use client"

import { useState } from "react"
import type { InventoryItem } from "@/lib/inventory"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"

interface MovementDialogProps {
  item: InventoryItem | null
  onClose: () => void
  onMovement: (id: string, cantidad: number, tipo: "entrada" | "salida") => void
}

export function MovementDialog({ item, onClose, onMovement }: MovementDialogProps) {
  const [cantidad, setCantidad] = useState<number>(1)
  const [tipo, setTipo] = useState<"entrada" | "salida">("salida")

  const handleSubmit = () => {
    if (item && cantidad > 0) {
      onMovement(item.id, cantidad, tipo)
      setCantidad(1)
      onClose()
    }
  }

  if (!item) return null

  // Asegurar que los campos existan
  const nombre = item.nombre || item.name || ""
  const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0

  return (
    <Dialog open={item !== null} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
          <DialogDescription>
            {nombre} - Disponible: {cantidadDisponible} unidades
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "salida")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrada" className="gap-2">
              <Plus className="h-4 w-4" />
              Entrada
            </TabsTrigger>
            <TabsTrigger value="salida" className="gap-2">
              <Minus className="h-4 w-4" />
              Salida/Uso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entrada" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad-entrada">Cantidad a Agregar</Label>
              <Input
                id="cantidad-entrada"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                placeholder="Ingrese cantidad"
              />
              <p className="text-sm text-muted-foreground">
                Nueva disponible: {cantidadDisponible + cantidad} unidades
              </p>
            </div>
          </TabsContent>

          <TabsContent value="salida" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad-salida">Cantidad a Usar/Vender</Label>
              <Input
                id="cantidad-salida"
                type="number"
                min="1"
                max={cantidadDisponible}
                value={cantidad}
                onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                placeholder="Ingrese cantidad"
              />
              <p className="text-sm text-muted-foreground">
                Nueva disponible: {Math.max(0, cantidadDisponible - cantidad)} unidades
              </p>
              {cantidad > cantidadDisponible && (
                <p className="text-sm text-destructive">La cantidad excede el stock disponible</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={cantidad <= 0 || (tipo === "salida" && cantidad > cantidadDisponible)}
          >
            Registrar {tipo === "entrada" ? "Entrada" : "Salida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
