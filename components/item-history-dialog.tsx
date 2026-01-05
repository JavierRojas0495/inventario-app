"use client"

import { useEffect, useState } from "react"
import type { InventoryItem, InventoryMovement } from "@/lib/inventory"
import { getMovementsByItem } from "@/lib/inventory"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Edit, Plus } from "lucide-react"

interface ItemHistoryDialogProps {
  item: InventoryItem | null
  onClose: () => void
}

export function ItemHistoryDialog({ item, onClose }: ItemHistoryDialogProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])

  useEffect(() => {
    if (item) {
      const itemMovements = getMovementsByItem(item.id)
      setMovements(itemMovements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
    }
  }, [item])

  const getMovementIcon = (tipo: InventoryMovement["tipo"]) => {
    switch (tipo) {
      case "entrada":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "salida":
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case "creacion":
        return <Plus className="h-4 w-4 text-blue-600" />
      default:
        return <Edit className="h-4 w-4 text-orange-600" />
    }
  }

  const getMovementBadge = (tipo: InventoryMovement["tipo"]) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      entrada: "default",
      salida: "destructive",
      creacion: "secondary",
      edicion: "outline",
      ajuste: "outline",
    }
    return <Badge variant={variants[tipo]}>{tipo.toUpperCase()}</Badge>
  }

  return (
    <Dialog open={item !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>
            {item && `${item.nombre} (${item.codigo}) - Stock actual: ${item.cantidad} unidades`}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {movements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay movimientos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad Anterior</TableHead>
                  <TableHead className="text-right">Cantidad Nueva</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {new Date(movement.fecha).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.tipo)}
                        {getMovementBadge(movement.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{movement.cantidadAnterior}</TableCell>
                    <TableCell className="text-right">{movement.cantidadNueva}</TableCell>
                    <TableCell className="text-right">
                      {movement.diferencia > 0 ? (
                        <span className="text-green-600">+{movement.diferencia}</span>
                      ) : movement.diferencia < 0 ? (
                        <span className="text-red-600">{movement.diferencia}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{movement.descripcion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
