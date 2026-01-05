"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryItem, InventoryMovement } from "@/lib/inventory"
import { FileSpreadsheet, FileText, FileDown } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface ReportsGeneratorProps {
  items: InventoryItem[]
  movements: InventoryMovement[]
}

export function ReportsGenerator({ items, movements }: ReportsGeneratorProps) {
  const generateCSV = () => {
    const headers = [
      "Código",
      "Nombre",
      "Inicial",
      "Usado Hoy",
      "Disponible",
      "Precio",
      "Valor Total",
      "Fecha Actualización",
    ]
    const rows = items.map((item) => [
      item.codigo,
      item.nombre,
      item.cantidadInicial.toString(),
      item.cantidadUsada.toString(),
      item.cantidadDisponible.toString(),
      item.precio.toFixed(2),
      (item.cantidadDisponible * item.precio).toFixed(2),
      new Date(item.fechaActualizacion).toLocaleString("es-ES"),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const generateWord = () => {
    const totalValor = items.reduce((sum, item) => sum + item.cantidadDisponible * item.precio, 0)
    const totalUnidades = items.reduce((sum, item) => sum + item.cantidadDisponible, 0)
    const totalUsado = items.reduce((sum, item) => sum + item.cantidadUsada, 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe de Inventario</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 3px solid #4a90e2; padding-bottom: 10px; }
          .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-item { margin: 10px 0; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4a90e2; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Informe de Inventario</h1>
        <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString("es-ES")}</p>
        
        <div class="summary">
          <h2>Resumen General</h2>
          <div class="summary-item"><strong>Total de productos:</strong> ${items.length}</div>
          <div class="summary-item"><strong>Total de unidades disponibles:</strong> ${totalUnidades}</div>
          <div class="summary-item"><strong>Total usado hoy:</strong> ${totalUsado}</div>
          <div class="summary-item"><strong>Valor total del inventario:</strong> $${totalValor.toFixed(2)}</div>
        </div>

        <h2>Detalle de Productos</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Inicial</th>
              <th>Usado Hoy</th>
              <th>Disponible</th>
              <th>Precio</th>
              <th>Valor Total</th>
              <th>Última Actualización</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>${item.cantidadInicial}</td>
                <td>${item.cantidadUsada}</td>
                <td>${item.cantidadDisponible}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${(item.cantidadDisponible * item.precio).toFixed(2)}</td>
                <td>${new Date(item.fechaActualizacion).toLocaleString("es-ES")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2>Últimos Movimientos</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad Anterior</th>
              <th>Cantidad Nueva</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${movements
              .slice(0, 20)
              .map(
                (mov) => `
              <tr>
                <td>${new Date(mov.fecha).toLocaleString("es-ES")}</td>
                <td>${mov.itemNombre}</td>
                <td>${mov.tipo}</td>
                <td>${mov.cantidadAnterior}</td>
                <td>${mov.cantidadNueva}</td>
                <td>${mov.descripcion}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Informe generado automáticamente por Sistema de Inventario</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "application/msword" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `informe_inventario_${new Date().toISOString().split("T")[0]}.doc`
    link.click()
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const totalValor = items.reduce((sum, item) => sum + item.cantidadDisponible * item.precio, 0)
    const totalUnidades = items.reduce((sum, item) => sum + item.cantidadDisponible, 0)
    const totalUsado = items.reduce((sum, item) => sum + item.cantidadUsada, 0)

    // Título
    doc.setFontSize(20)
    doc.text("Informe de Inventario", 14, 20)

    // Fecha
    doc.setFontSize(10)
    doc.text(`Fecha de generación: ${new Date().toLocaleString("es-ES")}`, 14, 30)

    // Resumen
    doc.setFontSize(14)
    doc.text("Resumen General", 14, 45)
    doc.setFontSize(10)
    doc.text(`Total de productos: ${items.length}`, 14, 55)
    doc.text(`Total de unidades disponibles: ${totalUnidades}`, 14, 62)
    doc.text(`Total usado hoy: ${totalUsado}`, 14, 69)
    doc.text(`Valor total del inventario: $${totalValor.toFixed(2)}`, 14, 76)

    // Tabla de productos
    autoTable(doc, {
      startY: 85,
      head: [["Código", "Nombre", "Inicial", "Usado", "Disponible", "Precio"]],
      body: items.map((item) => [
        item.codigo,
        item.nombre,
        item.cantidadInicial,
        item.cantidadUsada,
        item.cantidadDisponible,
        `$${item.precio.toFixed(2)}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [74, 144, 226] },
    })

    // Tabla de movimientos
    const finalY = (doc as any).lastAutoTable.finalY || 85
    doc.setFontSize(14)
    doc.text("Últimos Movimientos", 14, finalY + 15)

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Fecha", "Producto", "Tipo", "Cant. Ant.", "Cant. Nueva"]],
      body: movements.slice(0, 15).map((mov) => [
        new Date(mov.fecha).toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        mov.itemNombre,
        mov.tipo,
        mov.cantidadAnterior,
        mov.cantidadNueva,
      ]),
      theme: "striped",
      headStyles: { fillColor: [74, 144, 226] },
    })

    doc.save(`informe_inventario_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Informes</CardTitle>
        <CardDescription>Descarga reportes del inventario en diferentes formatos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={generateCSV} variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-semibold">Excel / CSV</div>
              <div className="text-xs text-muted-foreground">Formato de hoja de cálculo</div>
            </div>
          </Button>

          <Button onClick={generateWord} variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-semibold">Word / DOC</div>
              <div className="text-xs text-muted-foreground">Documento completo</div>
            </div>
          </Button>

          <Button onClick={generatePDF} variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <FileDown className="h-8 w-8 text-red-600" />
            <div>
              <div className="font-semibold">PDF</div>
              <div className="text-xs text-muted-foreground">Documento portátil</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
