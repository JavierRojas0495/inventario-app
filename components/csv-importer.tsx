"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CSVImporterProps {
  onImport: (csvText: string) => void
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [showExample, setShowExample] = useState(false)

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

  const downloadExample = () => {
    const exampleCSV = `Código,Nombre,Cantidad,Precio
P001,Laptop Dell XPS 15,10,1250.50
P002,Mouse Logitech MX Master,25,89.99
P003,Teclado Mecánico RGB,15,120.00
P004,Monitor 27" 4K,8,450.75`

    const blob = new Blob([exampleCSV], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "ejemplo_inventario.csv")
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Descarga iniciada",
      description: "Archivo de ejemplo descargado",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar desde CSV
        </CardTitle>
        <CardDescription>Carga productos masivamente desde un archivo Excel o CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Formato requerido del archivo CSV:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <div className="text-primary font-semibold">Código,Nombre,Cantidad,Precio</div>
                <div className="text-muted-foreground">P001,Laptop Dell,10,1250.50</div>
                <div className="text-muted-foreground">P002,Mouse Logitech,25,89.99</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Asegúrate de que la primera fila contenga los encabezados exactos mostrados arriba
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleImportClick} className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar archivo CSV
          </Button>
          <Button onClick={downloadExample} variant="outline" className="flex-1 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Descargar ejemplo
          </Button>
        </div>

        <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
      </CardContent>
    </Card>
  )
}
