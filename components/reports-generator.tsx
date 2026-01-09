"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { InventoryItem, InventoryMovement } from "@/lib/inventory"
import { FileSpreadsheet, FileText, FileDown, CalendarIcon, WarehouseIcon } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Warehouse {
  id: string
  name: string
}

interface ReportsGeneratorProps {
  items: InventoryItem[]
  movements: InventoryMovement[]
  currentWarehouseId?: string | null
}

export function ReportsGenerator({ items, movements, currentWarehouseId }: ReportsGeneratorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Set<string>>(new Set())
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(() => {
    const date = new Date()
    date.setDate(1) // Primer día del mes actual
    return date
  })
  const [fechaFin, setFechaFin] = useState<Date | undefined>(new Date())
  const [usarFiltroFechas, setUsarFiltroFechas] = useState(false)
  const supabase = createClient()

  // Cargar bodegas disponibles
  useEffect(() => {
    const loadWarehouses = async () => {
      if (!supabase) return
      const { data } = await supabase.from("warehouses").select("id, name").order("name")
      if (data) {
        setWarehouses(data)
        // Por defecto, seleccionar la bodega actual si existe
        if (currentWarehouseId && currentWarehouseId !== "all") {
          setSelectedWarehouseIds(new Set([currentWarehouseId]))
        } else if (data.length > 0) {
          // Si no hay bodega actual, seleccionar todas por defecto
          setSelectedWarehouseIds(new Set(data.map((w) => w.id)))
        }
      }
    }
    loadWarehouses()
  }, [supabase, currentWarehouseId])

  // Filtrar items y movements por bodegas seleccionadas
  const itemsFiltradosPorBodega = selectedWarehouseIds.size > 0
    ? items.filter((item) => {
        const warehouseId = (item as any).warehouse_id || (item as any).warehouseId
        return warehouseId && selectedWarehouseIds.has(warehouseId)
      })
    : items

  const movementsFiltradosPorBodega = selectedWarehouseIds.size > 0
    ? movements.filter((mov) => {
        const warehouseId = (mov as any).warehouse_id
        return warehouseId && selectedWarehouseIds.has(warehouseId)
      })
    : movements

  // Filtrar movimientos por rango de fechas si está habilitado
  const movimientosFiltrados = usarFiltroFechas && fechaInicio && fechaFin
    ? movementsFiltradosPorBodega.filter((mov) => {
        const fechaMov = mov.fecha || mov.created_at
        if (!fechaMov) return false
        const fecha = new Date(fechaMov)
        // Ajustar fechas para comparación solo por día
        const fechaMovDate = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
        const inicioDate = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate())
        const finDate = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate())
        return fechaMovDate >= inicioDate && fechaMovDate <= finDate
      })
    : movementsFiltradosPorBodega

  // Para items filtrados: usar items filtrados por bodega
  const itemsFiltrados = itemsFiltradosPorBodega

  // Calcular información contable
  const calcularInformacionContable = () => {
    // Calcular valores actuales del inventario (siempre) usando items filtrados por bodega
    const cantidadQueda = itemsFiltradosPorBodega.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      return sum + (typeof qty === "number" ? qty : 0)
    }, 0)

    const valorTotalMercancia = itemsFiltradosPorBodega.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      const price = item.precio ?? item.price ?? 0
      return sum + (typeof qty === "number" && typeof price === "number" ? qty * price : 0)
    }, 0)

    if (!usarFiltroFechas || !fechaInicio || !fechaFin) {
      // Sin filtro: mostrar información actual
      return {
        mercanciaEntro: 0,
        cantidadGastada: 0,
        dineroGastado: 0,
        cantidadQueda,
        valorTotalMercancia,
      }
    }

    // Con filtro: calcular basado en el período
    const entradas = movimientosFiltrados.filter(
      (mov) => (mov.tipo || mov.movement_type) === "entrada" || (mov.tipo || mov.movement_type) === "creacion"
    )
    const salidas = movimientosFiltrados.filter((mov) => (mov.tipo || mov.movement_type) === "salida")

    // Mercancía que entró: suma de todas las entradas en el período
    const mercanciaEntro = entradas.reduce((sum, mov) => {
      const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
      const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
      const cantidadEntrada = Math.max(0, cantidadNueva - cantidadAnterior)
      return sum + cantidadEntrada
    }, 0)

    // Cantidad gastada: suma de todas las salidas en el período
    const cantidadGastada = salidas.reduce((sum, mov) => {
      const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
      const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
      const cantidadSalida = Math.max(0, cantidadAnterior - cantidadNueva)
      return sum + cantidadSalida
    }, 0)

    // Dinero gastado: salidas * precio del producto en el momento del movimiento
    const dineroGastado = salidas.reduce((sum, mov) => {
      const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
      const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
      const cantidadSalida = Math.max(0, cantidadAnterior - cantidadNueva)
      
      // Buscar el precio del producto (usar precio actual del item)
      const itemId = mov.itemId || mov.item_id
      const item = items.find((i) => i.id === itemId)
      const precio = item?.precio ?? item?.price ?? 0
      
      return sum + (cantidadSalida * precio)
    }, 0)

    return {
      mercanciaEntro,
      cantidadGastada,
      dineroGastado,
      cantidadQueda,
      valorTotalMercancia,
    }
  }

  const infoContable = calcularInformacionContable()

  // Calcular cantidad total en el período para un producto
  const calcularCantidadTotalPeriodo = (item: InventoryItem) => {
    if (!usarFiltroFechas || !fechaInicio || !fechaFin) {
      // Sin filtro: usar cantidad inicial del día
      return item.cantidadInicial ?? item.quantity_initial_today ?? 0
    }

    // Con filtro: calcular entradas en el período para este producto
    const entradasProducto = movimientosFiltrados.filter(
      (mov) =>
        (mov.itemId === item.id || mov.item_id === item.id) &&
        ((mov.tipo || mov.movement_type) === "entrada" || (mov.tipo || mov.movement_type) === "creacion")
    )

    const cantidadTotalEntradas = entradasProducto.reduce((sum, mov) => {
      const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
      const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
      const cantidadEntrada = Math.max(0, cantidadNueva - cantidadAnterior)
      return sum + cantidadEntrada
    }, 0)

    // Si no hay entradas en el período, usar cantidad inicial del día
    return cantidadTotalEntradas > 0 ? cantidadTotalEntradas : item.cantidadInicial ?? item.quantity_initial_today ?? 0
  }

  // Calcular cantidad usada en el período para un producto
  const calcularCantidadUsadaPeriodo = (item: InventoryItem) => {
    if (!usarFiltroFechas || !fechaInicio || !fechaFin) {
      // Sin filtro: usar cantidad usada del día
      return item.cantidadUsada ?? item.quantity_used_today ?? 0
    }

    // Con filtro: calcular salidas en el período para este producto
    const salidasProducto = movimientosFiltrados.filter(
      (mov) =>
        (mov.itemId === item.id || mov.item_id === item.id) &&
        (mov.tipo || mov.movement_type) === "salida"
    )

    const cantidadTotalSalidas = salidasProducto.reduce((sum, mov) => {
      const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
      const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
      const cantidadSalida = Math.max(0, cantidadAnterior - cantidadNueva)
      return sum + cantidadSalida
    }, 0)

    return cantidadTotalSalidas
  }

  // Obtener nombres de bodegas seleccionadas
  const obtenerNombresBodegasSeleccionadas = () => {
    if (selectedWarehouseIds.size === 0) return "Ninguna bodega seleccionada"
    if (selectedWarehouseIds.size === warehouses.length) return "Todas las bodegas"
    
    const nombres = warehouses
      .filter((w) => selectedWarehouseIds.has(w.id))
      .map((w) => w.name)
    return nombres.length === 1 ? nombres[0] : nombres.join(", ")
  }

  const nombreBodega = obtenerNombresBodegasSeleccionadas()

  // Manejar selección de bodegas
  const toggleWarehouse = (warehouseId: string) => {
    const newSet = new Set(selectedWarehouseIds)
    if (newSet.has(warehouseId)) {
      newSet.delete(warehouseId)
    } else {
      newSet.add(warehouseId)
    }
    setSelectedWarehouseIds(newSet)
  }

  const selectAllWarehouses = () => {
    setSelectedWarehouseIds(new Set(warehouses.map((w) => w.id)))
  }

  const deselectAllWarehouses = () => {
    setSelectedWarehouseIds(new Set())
  }

  const generateCSV = () => {
    try {
      const itemsParaExportar = itemsFiltradosPorBodega
      if (!itemsParaExportar || itemsParaExportar.length === 0) {
        alert("No hay productos para exportar en el rango de fechas seleccionado")
        return
      }

      // Usar formato compatible con el importador: Código, Nombre, Cantidad, Precio
      const headers = [
        "Código",
        "Nombre",
        "Cantidad",
        "Precio",
      ]
      const rows = itemsParaExportar
        .filter((item) => item && item.id) // Filtrar items inválidos
        .map((item) => {
        const codigo = item.codigo || item.code || ""
        const nombre = item.nombre || item.name || ""
        const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0
        const precio = item.precio ?? item.price ?? 0

        // Exportar solo las columnas necesarias para importar: Código, Nombre, Cantidad, Precio
        // Usar cantidadDisponible como "Cantidad" para que sea compatible con el importador
        return [
          codigo,
          nombre,
          cantidadDisponible.toString(),
          precio.toFixed(2),
        ]
      })

      const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`
      link.click()
    } catch (error) {
      console.error("Error al generar CSV:", error)
      alert("Error al generar el archivo CSV. Por favor, intenta nuevamente.")
    }
  }

  const generateWord = () => {
    try {
      const itemsParaExportar = itemsFiltradosPorBodega
      if (!itemsParaExportar || itemsParaExportar.length === 0) {
        alert("No hay productos para exportar en el rango de fechas seleccionado")
        return
      }

      const totalValor = itemsParaExportar.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      const price = item.precio ?? item.price ?? 0
      return sum + (typeof qty === 'number' && typeof price === 'number' ? qty * price : 0)
    }, 0)
    const totalUnidades = itemsParaExportar.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      return sum + (typeof qty === 'number' ? qty : 0)
    }, 0)

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
        <p><strong>Bodega:</strong> ${nombreBodega}</p>
        <p><strong>Fecha de generación:</strong> ${format(new Date(), "PPP", { locale: es })}</p>
        ${
          usarFiltroFechas && fechaInicio && fechaFin
            ? `<p><strong>Período:</strong> ${format(fechaInicio, "PPP", { locale: es })} - ${format(fechaFin, "PPP", { locale: es })}</p>`
            : ""
        }
        
        <div class="summary">
          <h2>Resumen General</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div class="summary-item"><strong>Total de productos:</strong> ${itemsParaExportar.length}</div>
            <div class="summary-item"><strong>Valor Inventario:</strong> $${totalValor.toFixed(2)}</div>
          </div>
          ${
            usarFiltroFechas
              ? `
            <div style="border-top: 2px solid #4a90e2; padding-top: 20px; margin-top: 20px;">
              <h3 style="color: #4a90e2; margin-bottom: 15px;">Información Contable del Período</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="summary-item"><strong>Mercancía que entró:</strong> ${infoContable.mercanciaEntro.toLocaleString()} unidades</div>
                <div class="summary-item"><strong>Cantidad gastada:</strong> ${infoContable.cantidadGastada.toLocaleString()} unidades</div>
                <div class="summary-item"><strong>Dinero gastado:</strong> $${infoContable.dineroGastado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="summary-item"><strong>Cantidad que queda:</strong> ${infoContable.cantidadQueda.toLocaleString()} unidades</div>
                <div class="summary-item" style="grid-column: 1 / -1; font-size: 18px; color: #4a90e2; padding-top: 10px; border-top: 1px solid #ddd;">
                  <strong>Valor total de mercancía:</strong> $${infoContable.valorTotalMercancia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          `
              : ""
          }
        </div>

        <h2>Detalle de Productos</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Código</th>
              <th style="text-align: left;">Nombre</th>
              <th style="text-align: center;">Cantidad Total en el Período</th>
              <th style="text-align: center;">Usado en el Período</th>
              <th style="text-align: center;">Disponible</th>
              <th style="text-align: right;">Valor cada unidad</th>
              <th style="text-align: right;">Valor de toda la mercancía</th>
            </tr>
          </thead>
          <tbody>
            ${itemsParaExportar
              .filter((item) => item && item.id)
              .map((item) => {
                const codigo = item.codigo || item.code || ""
                const nombre = item.nombre || item.name || ""
                const cantidadTotalPeriodo = calcularCantidadTotalPeriodo(item)
                const cantidadUsadaPeriodo = calcularCantidadUsadaPeriodo(item)
                const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0
                const precio = item.precio ?? item.price ?? 0
                const valorTotalMercancia = cantidadDisponible * precio

                return `
              <tr>
                <td>${codigo}</td>
                <td>${nombre}</td>
                <td style="text-align: center;">${cantidadTotalPeriodo}</td>
                <td style="text-align: center;">${cantidadUsadaPeriodo}</td>
                <td style="text-align: center;">${cantidadDisponible}</td>
                <td style="text-align: right;">$${precio.toFixed(2)}</td>
                <td style="text-align: right;">$${valorTotalMercancia.toFixed(2)}</td>
              </tr>
            `
              })
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
            ${(usarFiltroFechas ? movimientosFiltrados : movements)
              .filter((mov) => mov && mov.id)
              .slice(0, 20)
              .map((mov) => {
                // Manejar diferentes formatos de fecha
                const fechaStr = mov.fecha || mov.created_at || new Date().toISOString()
                let fechaFormateada = "Fecha inválida"
                
                try {
                  const fecha = new Date(fechaStr)
                  if (!isNaN(fecha.getTime())) {
                    fechaFormateada = format(fecha, "PPP", { locale: es })
                  }
                } catch (e) {
                  console.error("Error al formatear fecha:", e, fechaStr)
                }

                // Manejar diferentes formatos de campos
                const itemNombre = mov.itemNombre || mov.description?.split(":")[0] || mov.description || "Producto desconocido"
                const tipo = mov.tipo || mov.movement_type || "ajuste"
                const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
                const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0
                const descripcion = mov.descripcion || mov.description || ""

                // Función para escapar HTML
                const escapeHtml = (text: string) => {
                  if (!text) return ""
                  return String(text)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;")
                }

                return `
              <tr>
                <td>${escapeHtml(fechaFormateada)}</td>
                <td>${escapeHtml(itemNombre)}</td>
                <td>${escapeHtml(tipo)}</td>
                <td>${cantidadAnterior}</td>
                <td>${cantidadNueva}</td>
                <td>${escapeHtml(descripcion)}</td>
              </tr>
            `
              })
              .join("")}
          </tbody>
        </table>

        <div class="summary" style="margin-top: 40px; border-top: 3px solid #4a90e2; padding-top: 20px;">
          <h2 style="color: #4a90e2; margin-bottom: 15px;">Resumen Final</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="summary-item"><strong>Total de productos:</strong> ${itemsParaExportar.length}</div>
            <div class="summary-item"><strong>Total Unidades Disponibles:</strong> ${totalUnidades.toLocaleString()}</div>
            <div class="summary-item" style="grid-column: 1 / -1; font-size: 18px; color: #4a90e2; padding-top: 10px; border-top: 1px solid #ddd;">
              <strong>Valor Inventario Total:</strong> $${totalValor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="summary-item" style="grid-column: 1 / -1;"><strong>Bodega:</strong> ${nombreBodega}</div>
          </div>
        </div>

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
    } catch (error) {
      console.error("Error al generar Word:", error)
      alert("Error al generar el archivo Word. Por favor, intenta nuevamente.")
    }
  }

  const generatePDF = () => {
    try {
      const itemsParaExportar = itemsFiltradosPorBodega
      if (!itemsParaExportar || itemsParaExportar.length === 0) {
        alert("No hay productos para exportar en el rango de fechas seleccionado")
        return
      }

      const doc = new jsPDF()
      const totalValor = itemsParaExportar.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      const price = item.precio ?? item.price ?? 0
      return sum + (typeof qty === 'number' && typeof price === 'number' ? qty * price : 0)
    }, 0)
    const totalUnidades = itemsParaExportar.reduce((sum, item) => {
      const qty = item.cantidadDisponible ?? item.quantity_available ?? 0
      return sum + (typeof qty === 'number' ? qty : 0)
    }, 0)

    // Título
    doc.setFontSize(20)
    doc.text("Informe de Inventario", 14, 20)

    // Bodega y Fecha
    doc.setFontSize(10)
    doc.text(`Bodega: ${nombreBodega}`, 14, 30)
    doc.text(`Fecha de generación: ${format(new Date(), "dd/MM/yyyy")}`, 14, 40)
    
    let yPos = 50
    if (usarFiltroFechas && fechaInicio && fechaFin) {
      doc.text(
        `Período: ${format(fechaInicio, "dd/MM/yyyy")} - ${format(fechaFin, "dd/MM/yyyy")}`,
        14,
        yPos
      )
      yPos += 7
    }

    // Resumen
    doc.setFontSize(14)
    doc.text("Resumen General", 14, yPos)
    yPos += 10
    doc.setFontSize(10)
    doc.text(`Total de productos: ${itemsParaExportar.length}`, 14, yPos)
    yPos += 7
    doc.text(`Valor Inventario: $${totalValor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos)
    
    if (usarFiltroFechas) {
      yPos += 10
      doc.setFontSize(12)
      doc.text("Información Contable del Período", 14, yPos)
      yPos += 7
      doc.setFontSize(10)
      doc.text(`Mercancía que entró: ${infoContable.mercanciaEntro.toLocaleString()} unidades`, 14, yPos)
      yPos += 7
      doc.text(`Cantidad gastada: ${infoContable.cantidadGastada.toLocaleString()} unidades`, 14, yPos)
      yPos += 7
      doc.text(`Dinero gastado: $${infoContable.dineroGastado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos)
      yPos += 7
      doc.text(`Cantidad que queda: ${infoContable.cantidadQueda.toLocaleString()} unidades`, 14, yPos)
      yPos += 7
      doc.text(`Valor total de mercancía: $${infoContable.valorTotalMercancia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos)
      yPos += 5
    }

    // Tabla de productos
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Código", "Nombre", "Cant. Total Período", "Usado Período", "Disponible", "Valor Unidad", "Valor Total"]],
      body: itemsParaExportar
        .filter((item) => item && item.id)
        .map((item) => {
          const codigo = item.codigo || item.code || ""
          const nombre = item.nombre || item.name || ""
          const cantidadTotalPeriodo = calcularCantidadTotalPeriodo(item)
          const cantidadUsadaPeriodo = calcularCantidadUsadaPeriodo(item)
          const cantidadDisponible = item.cantidadDisponible ?? item.quantity_available ?? 0
          const precio = item.precio ?? item.price ?? 0
          const valorTotalMercancia = cantidadDisponible * precio

          return [
            codigo,
            nombre,
            cantidadTotalPeriodo.toString(),
            cantidadUsadaPeriodo.toString(),
            cantidadDisponible.toString(),
            `$${precio.toFixed(2)}`,
            `$${valorTotalMercancia.toFixed(2)}`,
          ]
        }),
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
      body: movimientosFiltrados
        .filter((mov) => mov && mov.id)
        .slice(0, 15)
        .map((mov) => {
          // Manejar diferentes formatos de fecha
          const fechaStr = mov.fecha || mov.created_at || new Date().toISOString()
          let fechaFormateada = "Fecha inválida"
          
          try {
            const fecha = new Date(fechaStr)
            if (!isNaN(fecha.getTime())) {
              fechaFormateada = format(fecha, "dd/MM/yyyy")
            }
          } catch (e) {
            console.error("Error al formatear fecha:", e, fechaStr)
          }

          // Manejar diferentes formatos de campos
          const itemNombre = mov.itemNombre || mov.description?.split(":")[0] || "Producto desconocido"
          const tipo = mov.tipo || mov.movement_type || "ajuste"
          const cantidadAnterior = mov.cantidadAnterior ?? mov.quantity_before ?? 0
          const cantidadNueva = mov.cantidadNueva ?? mov.quantity_after ?? 0

          return [
            fechaFormateada,
            itemNombre,
            tipo,
            cantidadAnterior,
            cantidadNueva,
          ]
        }),
      theme: "striped",
      headStyles: { fillColor: [74, 144, 226] },
    })

    // Resumen final
    const finalY2 = (doc as any).lastAutoTable.finalY || yPos + 20
    doc.setFontSize(14)
    doc.text("Resumen Final", 14, finalY2 + 15)
    doc.setFontSize(10)
    doc.text(`Total de productos: ${itemsParaExportar.length}`, 14, finalY2 + 25)
    doc.text(`Total Unidades Disponibles: ${totalUnidades.toLocaleString()}`, 14, finalY2 + 32)
    doc.text(`Valor Inventario Total: $${totalValor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY2 + 39)
    doc.text(`Bodega: ${nombreBodega}`, 14, finalY2 + 46)

      doc.save(`informe_inventario_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Error al generar el archivo PDF. Por favor, intenta nuevamente.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Informes</CardTitle>
        <CardDescription>Descarga reportes del inventario en diferentes formatos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de bodegas */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label className="font-semibold flex items-center gap-2">
              <WarehouseIcon className="h-4 w-4" />
              Bodegas para el Informe
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllWarehouses}
                className="h-7 text-xs"
              >
                Seleccionar todas
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAllWarehouses}
                className="h-7 text-xs"
              >
                Deseleccionar todas
              </Button>
            </div>
          </div>
          
          {warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay bodegas disponibles</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`warehouse-${warehouse.id}`}
                    checked={selectedWarehouseIds.has(warehouse.id)}
                    onCheckedChange={() => toggleWarehouse(warehouse.id)}
                  />
                  <Label
                    htmlFor={`warehouse-${warehouse.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {warehouse.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
          
          {selectedWarehouseIds.size > 0 && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              <strong>Bodegas seleccionadas:</strong> {nombreBodega}
            </p>
          )}
        </div>

        {/* Selector de fechas */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="usarFiltroFechas"
              checked={usarFiltroFechas}
              onChange={(e) => setUsarFiltroFechas(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="usarFiltroFechas" className="font-semibold cursor-pointer">
              Filtrar por rango de fechas
            </Label>
          </div>

          {usarFiltroFechas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Resumen contable */}
          {usarFiltroFechas && fechaInicio && fechaFin && (
            <div className="mt-4 p-4 bg-background rounded-lg border">
              <h3 className="font-semibold mb-3">Resumen Contable del Período</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mercancía que entró</p>
                  <p className="font-semibold">{infoContable.mercanciaEntro} unidades</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cantidad gastada</p>
                  <p className="font-semibold">{infoContable.cantidadGastada} unidades</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dinero gastado</p>
                  <p className="font-semibold">${infoContable.dineroGastado.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cantidad que queda</p>
                  <p className="font-semibold">{infoContable.cantidadQueda} unidades</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Valor total de mercancía</p>
                  <p className="font-semibold text-lg">${infoContable.valorTotalMercancia.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

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
