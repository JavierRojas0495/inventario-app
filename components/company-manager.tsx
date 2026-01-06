"use client"

import type React from "react"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompanyManagerProps {
  onCompanyChange: (companyId: string | null) => void
}

export function CompanyManager({ onCompanyChange }: CompanyManagerProps) {
  const [companies, setCompanies] = useState<Company[]>(getCompanies())
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(getSelectedCompany())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
  })

  const { toast } = useToast()

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

    setFormData({ nombre: "", nit: "", direccion: "", telefono: "" })
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

      setEditingCompany(null)
      setFormData({ nombre: "", nit: "", direccion: "", telefono: "" })

      toast({
        title: "Empresa actualizada",
        description: "Los cambios se guardaron correctamente",
      })
    }
  }

  const handleDeleteCompany = (id: string) => {
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

  const handleSelectCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (company) {
      setSelectedCompanyState(company)
      setSelectedCompany(company.id)
      onCompanyChange(company.id)

      toast({
        title: "Empresa seleccionada",
        description: `Ahora trabajas con ${company.nombre}`,
      })
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestión de Empresas
        </CardTitle>
        <CardDescription>Selecciona o crea una empresa para gestionar su inventario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="company-select" className="text-sm font-medium mb-2 block">
              Empresa activa
            </Label>
            <Select value={selectedCompany?.id || ""} onValueChange={handleSelectCompany}>
              <SelectTrigger id="company-select">
                <SelectValue placeholder="Selecciona una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" title="Agregar empresa">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Empresa</DialogTitle>
                  <DialogDescription>Ingresa la información de la empresa</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCompany} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Mi Empresa S.A."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nit">NIT</Label>
                    <Input
                      id="nit"
                      value={formData.nit}
                      onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      placeholder="123456789-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Calle Principal #123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Empresa</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {companies.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Empresas registradas</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{company.nombre}</p>
                    {company.nit && <p className="text-xs text-muted-foreground">NIT: {company.nit}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingCompany?.id === company.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingCompany(null)
                          setFormData({ nombre: "", nit: "", direccion: "", telefono: "" })
                        }
                      }}
                    >
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
                          <div>
                            <Label htmlFor="edit-nombre">Nombre *</Label>
                            <Input
                              id="edit-nombre"
                              value={formData.nombre}
                              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-nit">NIT</Label>
                            <Input
                              id="edit-nit"
                              value={formData.nit}
                              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-direccion">Dirección</Label>
                            <Input
                              id="edit-direccion"
                              value={formData.direccion}
                              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-telefono">Teléfono</Label>
                            <Input
                              id="edit-telefono"
                              value={formData.telefono}
                              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingCompany(null)
                                setFormData({ nombre: "", nit: "", direccion: "", telefono: "" })
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit">Guardar Cambios</Button>
                          </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
