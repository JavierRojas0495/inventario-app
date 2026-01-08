-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'creacion', 'edicion', 'ajuste')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos los usuarios autenticados pueden ver movimientos
CREATE POLICY "inventory_movements_select_authenticated"
  ON public.inventory_movements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden crear movimientos
CREATE POLICY "inventory_movements_insert_authenticated"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX IF NOT EXISTS inventory_movements_item_idx ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS inventory_movements_warehouse_idx ON public.inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_movements_created_at_idx ON public.inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_type_idx ON public.inventory_movements(movement_type);
