"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getSelectedCompany,
  setSelectedCompany,
  type Company,
} from "@/lib/company"
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
import { Building2, Plus, Settings, Pencil, Trash2, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompanySelectorProps {
  onCompanyChange: (companyId: string | null) => void
}

export function CompanySelector({ onCompanyChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>(getCompanies())
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(getSelectedCompany())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    setCompanies(getCompanies())
    setSelectedCompanyState(getSelectedCompany())
  }, [])

  const resetForm = () => {
    setFormData({ nombre: "", nit: "", direccion: "", telefono: "" })
    setEditingCompany(null)
  }

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive",
      })
      return
    }

    const newCompany = addCompany(formData)
    setCompanies(getCompanies())
    setSelectedCompanyState(newCompany)
    setSelectedCompany(newCompany.id)
    onCompanyChange(newCompany.id)

    resetForm()
    setIsAddDialogOpen(false)

    toast({
      title: "Empresa creada",
      description: `${formData.nombre} se agregó exitosamente`,
    })
  }

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCompany || !formData.nombre.trim()) return

    const success = updateCompany(editingCompany.id, formData)
    if (success) {
      setCompanies(getCompanies())
      if (selectedCompany?.id === editingCompany.id) {
        setSelectedCompanyState(getSelectedCompany())
      }

      resetForm()

      toast({
        title: "Empresa actualizada",
        description: "Los cambios se guardaron correctamente",
      })
    }
  }

  const handleDeleteCompany = (id: string) => {
    if (companies.length === 1) {
      toast({
        title: "Error",
        description: "No puedes eliminar la única empresa",
        variant: "destructive",
      })
      return
    }

    const company = companies.find((c) => c.id === id)
    const success = deleteCompany(id)

    if (success) {
      setCompanies(getCompanies())

      if (selectedCompany?.id === id) {
        const remaining = getCompanies()
        const newSelected = remaining[0] || null
        setSelectedCompanyState(newSelected)
        if (newSelected) {
          setSelectedCompany(newSelected.id)
          onCompanyChange(newSelected.id)
        } else {
          onCompanyChange(null)
        }
      }

      toast({
        title: "Empresa eliminada",
        description: `${company?.nombre} se eliminó correctamente`,
      })
    }
  }

  const handleSelectCompany = (company: Company) => {
    setSelectedCompanyState(company)
    setSelectedCompany(company.id)
    onCompanyChange(company.id)

    toast({
      title: "Empresa seleccionada",
      description: `Trabajando con ${company.nombre}`,
    })
  }

  const startEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      nombre: company.nombre,
      nit: company.nit || "",
      direccion: company.direccion || "",
      telefono: company.telefono || "",
    })
  }

  return (
    <>
      {/* Selector dropdown compacto */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{selectedCompany?.nombre || "Seleccionar empresa"}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Empresas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className={selectedCompany?.id === company.id ? "bg-accent" : ""}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {company.nombre}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva empresa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsManageDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Gestionar empresas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para agregar empresa */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Empresa</DialogTitle>
            <DialogDescription>Registra una nueva empresa para gestionar su inventario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Mi Empresa S.A."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                placeholder="123456789-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle Principal #123"
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
              <Button type="submit">Crear Empresa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar empresas */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Empresas</DialogTitle>
            <DialogDescription>Edita o elimina empresas registradas</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="font-medium">{company.nombre}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {company.nit && <p>NIT: {company.nit}</p>}
                    {company.direccion && <p>{company.direccion}</p>}
                    {company.telefono && <p>{company.telefono}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(company)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Empresa</DialogTitle>
                        <DialogDescription>Actualiza la información de la empresa</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateCompany} className="space-y-4">
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
                          <Label htmlFor="edit-nit">NIT</Label>
                          <Input
                            id="edit-nit"
                            value={formData.nit}
                            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-direccion">Dirección</Label>
                          <Input
                            id="edit-direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
                    onClick={() => handleDeleteCompany(company.id)}
                    disabled={companies.length === 1}
                    title={companies.length === 1 ? "No puedes eliminar la única empresa" : "Eliminar empresa"}
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
