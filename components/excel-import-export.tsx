"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload } from "lucide-react"
import type { InventoryItem } from "@/lib/inventory"
import { useToast } from "@/hooks/use-toast"

interface ExcelImportExportProps {
  items: InventoryItem[]
  onImport: (csvText: string) => void
}

export function ExcelImportExport({ items, onImport }: ExcelImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay productos para exportar",
        variant: "destructive",
      })
      return
    }

    const headers = ["Código", "Nombre", "Cantidad", "Precio"]
    const rows = items
      .filter((item) => item && item.id)
      .map((item) => {
        const codigo = item.codigo || item.code || ""
        const nombre = item.nombre || item.name || ""
        const cantidad = item.cantidadDisponible ?? item.quantity_available ?? item.cantidad ?? 0
        const precio = item.precio ?? item.price ?? 0
        return [codigo, nombre, cantidad.toString(), precio.toString()]
      })

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `inventario_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${items.length} productos`,
    })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      onImport(text)
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar/Exportar</CardTitle>
        <CardDescription>Importa productos desde un archivo CSV/Excel o exporta tu inventario actual</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleImportClick} variant="outline" className="flex-1 bg-transparent">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV/Excel
        </Button>
        <Button onClick={handleExport} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Exportar a CSV
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
      </CardContent>
    </Card>
  )
}
