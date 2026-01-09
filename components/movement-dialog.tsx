"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, CalendarIcon, Package, AlertCircle, CheckCircle2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MovementDialogProps {
  item: InventoryItem | null
  onClose: () => void
  onMovement: (id: string, cantidad: number, tipo: "entrada" | "salida", fecha?: string, descripcion?: string) => void
}

export function MovementDialog({ item, onClose, onMovement }: MovementDialogProps) {
  const [cantidad, setCantidad] = useState<string>("")
  const [tipo, setTipo] = useState<"entrada" | "salida">("salida")
  const [fecha, setFecha] = useState<Date | undefined>(new Date())
  const [descripcion, setDescripcion] = useState<string>("")

  // Resetear cuando cambia el tipo o el item
  useEffect(() => {
    setCantidad("")
    setDescripcion("")
    setFecha(new Date())
  }, [tipo, item])

  const handleSubmit = () => {
    if (!item) return
    
    const cantidadNum = Number.parseFloat(cantidad)
    
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return
    }

    if (tipo === "salida" && cantidadNum > cantidadDisponible) {
      return
    }

    const fechaStr = fecha ? format(fecha, "yyyy-MM-dd") : undefined
    onMovement(item.id, cantidadNum, tipo, fechaStr, descripcion.trim() || undefined)
    setCantidad("")
    setDescripcion("")
    setFecha(new Date())
    onClose()
  }

  if (!item) return null

  // Asegurar que los campos existan
  const codigo = item.codigo || item.code || ""
  const nombre = item.nombre || item.name || ""
  const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0
  const precio = item.precio ?? item.price ?? 0
  
  const cantidadNum = Number.parseFloat(cantidad) || 0
  const nuevaCantidad = tipo === "entrada" 
    ? cantidadDisponible + cantidadNum 
    : Math.max(0, cantidadDisponible - cantidadNum)
  const valorTotal = nuevaCantidad * precio
  const esValido = cantidadNum > 0 && (tipo === "entrada" || cantidadNum <= cantidadDisponible)

  return (
    <Dialog open={item !== null} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registrar Movimiento de Inventario
          </DialogTitle>
          <DialogDescription>
            Registra una entrada o salida de productos del inventario
          </DialogDescription>
        </DialogHeader>

        {/* Información del Producto */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Producto</p>
                  <p className="text-lg font-semibold">{nombre}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {codigo}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-xl font-bold text-primary">{cantidadDisponible.toLocaleString()} unidades</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio Unitario</p>
                  <p className="text-xl font-bold">${precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selector de Tipo */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Tipo de Movimiento</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={tipo === "entrada" ? "default" : "outline"}
                className={cn(
                  "h-auto py-4 flex-col gap-2",
                  tipo === "entrada" && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => setTipo("entrada")}
              >
                <Plus className="h-6 w-6" />
                <span className="font-semibold">Entrada</span>
                <span className="text-xs opacity-90">Agregar productos</span>
              </Button>
              <Button
                type="button"
                variant={tipo === "salida" ? "default" : "outline"}
                className={cn(
                  "h-auto py-4 flex-col gap-2",
                  tipo === "salida" && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => setTipo("salida")}
              >
                <Minus className="h-6 w-6" />
                <span className="font-semibold">Salida</span>
                <span className="text-xs opacity-90">Retirar productos</span>
              </Button>
            </div>
          </div>

          {/* Campos del Formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">
                Cantidad {tipo === "entrada" ? "a Agregar" : "a Retirar"} *
              </Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max={tipo === "salida" ? cantidadDisponible : undefined}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ingrese la cantidad"
                className="text-lg"
                autoFocus
              />
              {tipo === "salida" && cantidadNum > cantidadDisponible && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La cantidad excede el stock disponible ({cantidadDisponible.toLocaleString()} unidades)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha del Movimiento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-11", !fecha && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fecha} onSelect={setFecha} initialFocus locale={es} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción / Notas (Opcional)</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Compra a proveedor, Uso en obra, Ajuste de inventario..."
                rows={3}
              />
            </div>
          </div>

          {/* Resumen del Movimiento */}
          {cantidadNum > 0 && (
            <Card className={cn(
              "border-2",
              tipo === "entrada" ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
            )}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {tipo === "entrada" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h4 className="font-semibold">Resumen del Movimiento</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cantidad Actual</p>
                      <p className="font-semibold text-lg">{cantidadDisponible.toLocaleString()} unidades</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {tipo === "entrada" ? "Cantidad a Agregar" : "Cantidad a Retirar"}
                      </p>
                      <p className={cn(
                        "font-semibold text-lg",
                        tipo === "entrada" ? "text-green-600" : "text-red-600"
                      )}>
                        {tipo === "entrada" ? "+" : "-"} {cantidadNum.toLocaleString()} unidades
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nueva Cantidad</p>
                      <p className="font-bold text-xl text-primary">{nuevaCantidad.toLocaleString()} unidades</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-xl">${valorTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!esValido}
            className={cn(
              "min-w-[140px]",
              tipo === "entrada" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {tipo === "entrada" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Entrada
              </>
            ) : (
              <>
                <Minus className="mr-2 h-4 w-4" />
                Registrar Salida
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
