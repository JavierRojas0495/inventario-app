"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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

interface Warehouse {
  id: string
  name: string
  location: string | null
  manager: string | null
  phone: string | null
}

interface WarehouseSelectorProps {
  onWarehouseChange: (warehouseId: string | null) => void
}

export function WarehouseSelector({ onWarehouseChange }: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
    phone: "",
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    const { data } = await supabase.from("warehouses").select("*").order("name")

    if (data && data.length > 0) {
      setWarehouses(data)

      // Restaurar bodega seleccionada de localStorage
      const savedId = localStorage.getItem("selectedWarehouseId")
      if (savedId === "all") {
        setSelectedWarehouseId("all")
        setSelectedWarehouse(null)
        onWarehouseChange("all")
      } else if (savedId) {
        const warehouse = data.find((w) => w.id === savedId)
        if (warehouse) {
          setSelectedWarehouseId(warehouse.id)
          setSelectedWarehouse(warehouse)
          onWarehouseChange(warehouse.id)
        } else {
          // Si la bodega guardada no existe, seleccionar la primera
          setSelectedWarehouseId(data[0].id)
          setSelectedWarehouse(data[0])
          localStorage.setItem("selectedWarehouseId", data[0].id)
          onWarehouseChange(data[0].id)
        }
      } else {
        // Primera vez, seleccionar la primera bodega
        setSelectedWarehouseId(data[0].id)
        setSelectedWarehouse(data[0])
        localStorage.setItem("selectedWarehouseId", data[0].id)
        onWarehouseChange(data[0].id)
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: "", location: "", manager: "", phone: "" })
    setEditingWarehouse(null)
  }

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la bodega es requerido",
        variant: "destructive",
      })
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("warehouses")
      .insert([
        {
          name: formData.name,
          location: formData.location || null,
          manager: formData.manager || null,
          phone: formData.phone || null,
          created_by: userData.user?.id,
        },
      ])
      .select()

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    if (data && data[0]) {
      await loadWarehouses()
      setSelectedWarehouseId(data[0].id)
      setSelectedWarehouse(data[0])
      localStorage.setItem("selectedWarehouseId", data[0].id)
      onWarehouseChange(data[0].id)
    }

    resetForm()
    setIsAddDialogOpen(false)

    toast({
      title: "Bodega creada",
      description: `${formData.name} se agregó exitosamente`,
    })
  }

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingWarehouse || !formData.name.trim()) return

    const { error } = await supabase
      .from("warehouses")
      .update({
        name: formData.name,
        location: formData.location || null,
        manager: formData.manager || null,
        phone: formData.phone || null,
      })
      .eq("id", editingWarehouse.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    await loadWarehouses()
    resetForm()

    toast({
      title: "Bodega actualizada",
      description: "Los cambios se guardaron correctamente",
    })
  }

  const handleDeleteWarehouse = async (id: string) => {
    if (warehouses.length === 1) {
      toast({
        title: "Error",
        description: "No puedes eliminar la única bodega",
        variant: "destructive",
      })
      return
    }

    const warehouse = warehouses.find((w) => w.id === id)

    const { error } = await supabase.from("warehouses").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    await loadWarehouses()

    if (selectedWarehouseId === id) {
      const remaining = warehouses.filter((w) => w.id !== id)
      if (remaining.length > 0) {
        setSelectedWarehouseId(remaining[0].id)
        setSelectedWarehouse(remaining[0])
        localStorage.setItem("selectedWarehouseId", remaining[0].id)
        onWarehouseChange(remaining[0].id)
      } else {
        setSelectedWarehouseId(null)
        setSelectedWarehouse(null)
        localStorage.removeItem("selectedWarehouseId")
        onWarehouseChange(null)
      }
    }

    toast({
      title: "Bodega eliminada",
      description: `${warehouse?.name} se eliminó correctamente`,
    })
  }

  const handleSelectWarehouse = (warehouseId: string) => {
    if (warehouseId === "all") {
      setSelectedWarehouseId("all")
      setSelectedWarehouse(null)
      localStorage.setItem("selectedWarehouseId", "all")
      onWarehouseChange("all")
      toast({
        title: "Todas las bodegas",
        description: "Visualizando inventario de todas las bodegas",
      })
    } else {
      const warehouse = warehouses.find((w) => w.id === warehouseId)
      if (warehouse) {
        setSelectedWarehouseId(warehouse.id)
        setSelectedWarehouse(warehouse)
        localStorage.setItem("selectedWarehouseId", warehouse.id)
        onWarehouseChange(warehouse.id)
        toast({
          title: "Bodega seleccionada",
          description: `Trabajando con ${warehouse.name}`,
        })
      }
    }
  }

  const startEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      location: warehouse.location || "",
      manager: warehouse.manager || "",
      phone: warehouse.phone || "",
    })
  }

  const getDisplayName = () => {
    if (selectedWarehouseId === "all") return "Todas las bodegas"
    return selectedWarehouse?.name || "Seleccionar bodega"
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
              {warehouse.name}
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
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bodega Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Calle Principal #123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Responsable</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  <p className="font-medium">{warehouse.name}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {warehouse.location && <p>Ubicación: {warehouse.location}</p>}
                    {warehouse.manager && <p>Responsable: {warehouse.manager}</p>}
                    {warehouse.phone && <p>Tel: {warehouse.phone}</p>}
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
                          <Label htmlFor="edit-name">Nombre *</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-location">Ubicación</Label>
                          <Input
                            id="edit-location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-manager">Responsable</Label>
                          <Input
                            id="edit-manager"
                            value={formData.manager}
                            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-phone">Teléfono</Label>
                          <Input
                            id="edit-phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
