"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, CalendarIcon } from "lucide-react"
import { getWarehouses } from "@/lib/warehouse"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { cn } from "@/lib/utils"

interface AddItemFormProps {
  onAdd: (
    item: { codigo: string; nombre: string; cantidad: number; precio: number; fechaIngreso?: string },
    warehouseId?: string
  ) => void
  currentWarehouseId?: string | null // Bodega actual seleccionada
}

export function AddItemForm({ onAdd, currentWarehouseId }: AddItemFormProps) {
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [fechaIngreso, setFechaIngreso] = useState<Date | undefined>(new Date())
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("") // Selector de bodega

  const needsWarehouseSelector = currentWarehouseId === "all"
  const warehouses = needsWarehouseSelector ? getWarehouses() : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!codigo.trim() || !nombre.trim() || !cantidad || !precio) {
      return
    }

    if (needsWarehouseSelector && !selectedWarehouseId) {
      return
    }

    const warehouseId = needsWarehouseSelector ? selectedWarehouseId : currentWarehouseId

    onAdd(
      {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        cantidad: Number.parseFloat(cantidad) || 0,
        precio: Number.parseFloat(precio) || 0,
        fechaIngreso: fechaIngreso ? format(fechaIngreso, "yyyy-MM-dd") : undefined,
      },
      warehouseId || undefined,
    )

    setCodigo("")
    setNombre("")
    setCantidad("")
    setPrecio("")
    setFechaIngreso(new Date())
    setSelectedWarehouseId("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Producto</CardTitle>
        <CardDescription>Añade un nuevo producto al inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {needsWarehouseSelector && (
            <div className="space-y-2">
              <Label htmlFor="warehouse">Bodega *</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId} required>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Selecciona una bodega" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código/SKU</Label>
              <Input
                id="codigo"
                placeholder="PROD-001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                placeholder="Producto ejemplo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad Inicial</Label>
              <Input
                id="cantidad"
                type="number"
                placeholder="100"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                placeholder="99.99"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaIngreso && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaIngreso ? format(fechaIngreso, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaIngreso}
                    onSelect={setFechaIngreso}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
