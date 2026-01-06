"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getWarehouses,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getSelectedWarehouse,
  setSelectedWarehouse,
  getSelectedWarehouseId,
  type Warehouse,
} from "@/lib/warehouse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WarehouseIcon, Plus, Settings, Pencil, Trash2, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WarehouseSelectorProps {
  onWarehouseChange: (warehouseId: string | null) => void
}

export function WarehouseSelector({ onWarehouseChange }: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(getWarehouses())
  const [selectedWarehouse, setSelectedWarehouseState] = useState<Warehouse | null>(getSelectedWarehouse())
  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string | null>(getSelectedWarehouseId())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    responsable: "",
    telefono: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    setWarehouses(getWarehouses())
    setSelectedWarehouseState(getSelectedWarehouse())
    setSelectedWarehouseIdState(getSelectedWarehouseId())
  }, [])

  const resetForm = () => {
    setFormData({ nombre: "", ubicacion: "", responsable: "", telefono: "" })
    setEditingWarehouse(null)
  }

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la bodega es requerido",
        variant: "destructive",
      })
      return
    }

    const newWarehouse = addWarehouse(formData)
    setWarehouses(getWarehouses())
    setSelectedWarehouseState(newWarehouse)
    setSelectedWarehouseIdState(newWarehouse.id)
    setSelectedWarehouse(newWarehouse.id)
    onWarehouseChange(newWarehouse.id)

    resetForm()
    setIsAddDialogOpen(false)

    toast({
      title: "Bodega creada",
      description: `${formData.nombre} se agregó exitosamente`,
    })
  }

  const handleUpdateWarehouse = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingWarehouse || !formData.nombre.trim()) return

    const success = updateWarehouse(editingWarehouse.id, formData)
    if (success) {
      setWarehouses(getWarehouses())
      if (selectedWarehouse?.id === editingWarehouse.id) {
        setSelectedWarehouseState(getSelectedWarehouse())
      }

      resetForm()

      toast({
        title: "Bodega actualizada",
        description: "Los cambios se guardaron correctamente",
      })
    }
  }

  const handleDeleteWarehouse = (id: string) => {
    if (warehouses.length === 1) {
      toast({
        title: "Error",
        description: "No puedes eliminar la única bodega",
        variant: "destructive",
      })
      return
    }

    const warehouse = warehouses.find((w) => w.id === id)
    const success = deleteWarehouse(id)

    if (success) {
      setWarehouses(getWarehouses())

      if (selectedWarehouseId === id) {
        const remaining = getWarehouses()
        const newSelected = remaining[0] || null
        setSelectedWarehouseState(newSelected)
        setSelectedWarehouseIdState(newSelected?.id || null)
        if (newSelected) {
          setSelectedWarehouse(newSelected.id)
          onWarehouseChange(newSelected.id)
        } else {
          onWarehouseChange(null)
        }
      }

      toast({
        title: "Bodega eliminada",
        description: `${warehouse?.nombre} se eliminó correctamente`,
      })
    }
  }

  const handleSelectWarehouse = (warehouseId: string) => {
    if (warehouseId === "all") {
      setSelectedWarehouseState(null)
      setSelectedWarehouseIdState("all")
      setSelectedWarehouse("all")
      onWarehouseChange("all")
      toast({
        title: "Todas las bodegas",
        description: "Visualizando inventario de todas las bodegas",
      })
    } else {
      const warehouse = warehouses.find((w) => w.id === warehouseId)
      if (warehouse) {
        setSelectedWarehouseState(warehouse)
        setSelectedWarehouseIdState(warehouse.id)
        setSelectedWarehouse(warehouse.id)
        onWarehouseChange(warehouse.id)
        toast({
          title: "Bodega seleccionada",
          description: `Trabajando con ${warehouse.nombre}`,
        })
      }
    }
  }

  const startEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      nombre: warehouse.nombre,
      ubicacion: warehouse.ubicacion || "",
      responsable: warehouse.responsable || "",
      telefono: warehouse.telefono || "",
    })
  }

  const getDisplayName = () => {
    if (selectedWarehouseId === "all") return "Todas las bodegas"
    return selectedWarehouse?.nombre || "Seleccionar bodega"
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <WarehouseIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{getDisplayName()}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Bodegas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleSelectWarehouse("all")}
            className={selectedWarehouseId === "all" ? "bg-accent" : ""}
          >
            <WarehouseIcon className="h-4 w-4 mr-2" />
            Todas las bodegas
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {warehouses.map((warehouse) => (
            <DropdownMenuItem
              key={warehouse.id}
              onClick={() => handleSelectWarehouse(warehouse.id)}
              className={selectedWarehouseId === warehouse.id ? "bg-accent" : ""}
            >
              <WarehouseIcon className="h-4 w-4 mr-2" />
              {warehouse.nombre}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva bodega
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsManageDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Gestionar bodegas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Bodega</DialogTitle>
            <DialogDescription>Registra una nueva bodega para gestionar su inventario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddWarehouse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Bodega Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Calle Principal #123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear Bodega</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Bodegas</DialogTitle>
            <DialogDescription>Edita o elimina bodegas registradas</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="font-medium">{warehouse.nombre}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {warehouse.ubicacion && <p>Ubicación: {warehouse.ubicacion}</p>}
                    {warehouse.responsable && <p>Responsable: {warehouse.responsable}</p>}
                    {warehouse.telefono && <p>Tel: {warehouse.telefono}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(warehouse)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Bodega</DialogTitle>
                        <DialogDescription>Actualiza la información de la bodega</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateWarehouse} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nombre">Nombre *</Label>
                          <Input
                            id="edit-nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-ubicacion">Ubicación</Label>
                          <Input
                            id="edit-ubicacion"
                            value={formData.ubicacion}
                            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-responsable">Responsable</Label>
                          <Input
                            id="edit-responsable"
                            value={formData.responsable}
                            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-telefono">Teléfono</Label>
                          <Input
                            id="edit-telefono"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancelar
                          </Button>
                          <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
                    disabled={warehouses.length === 1}
                    title={warehouses.length === 1 ? "No puedes eliminar la única bodega" : "Eliminar bodega"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
