-- Crear tabla de bodegas
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  phone TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos los usuarios autenticados pueden ver las bodegas
CREATE POLICY "warehouses_select_authenticated"
  ON public.warehouses FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden crear bodegas
CREATE POLICY "warehouses_insert_authenticated"
  ON public.warehouses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Todos los usuarios autenticados pueden actualizar bodegas
CREATE POLICY "warehouses_update_authenticated"
  ON public.warehouses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Solo admins o creadores pueden eliminar bodegas
CREATE POLICY "warehouses_delete_own_or_admin"
  ON public.warehouses FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Índices
CREATE INDEX IF NOT EXISTS warehouses_name_idx ON public.warehouses(name);

-- Trigger para updated_at
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
