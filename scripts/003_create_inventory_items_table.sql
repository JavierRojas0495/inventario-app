-- Crear tabla de items de inventario
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_initial_today INTEGER NOT NULL DEFAULT 0,
  quantity_used_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, code)
);

-- Habilitar RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos los usuarios autenticados pueden ver items
CREATE POLICY "inventory_items_select_authenticated"
  ON public.inventory_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden crear items
CREATE POLICY "inventory_items_insert_authenticated"
  ON public.inventory_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden actualizar items
CREATE POLICY "inventory_items_update_authenticated"
  ON public.inventory_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden eliminar items
CREATE POLICY "inventory_items_delete_authenticated"
  ON public.inventory_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX IF NOT EXISTS inventory_items_warehouse_idx ON public.inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_items_code_idx ON public.inventory_items(code);
CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON public.inventory_items(name);

-- Trigger para updated_at
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
