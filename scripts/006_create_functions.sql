-- Función para resetear cantidades diarias (se debe ejecutar al inicio del día)
CREATE OR REPLACE FUNCTION reset_daily_quantities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventory_items
  SET 
    quantity_initial_today = quantity_available,
    quantity_used_today = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

-- Función para obtener estadísticas de inventario por bodega
CREATE OR REPLACE FUNCTION get_warehouse_stats(warehouse_uuid UUID)
RETURNS TABLE (
  total_products BIGINT,
  total_available INTEGER,
  total_used_today INTEGER,
  total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_products,
    COALESCE(SUM(quantity_available), 0)::INTEGER as total_available,
    COALESCE(SUM(quantity_used_today), 0)::INTEGER as total_used_today,
    COALESCE(SUM(quantity_available * price), 0) as total_value
  FROM public.inventory_items
  WHERE warehouse_id = warehouse_uuid;
END;
$$;

-- Función para obtener estadísticas globales (todas las bodegas)
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE (
  total_products BIGINT,
  total_available INTEGER,
  total_used_today INTEGER,
  total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_products,
    COALESCE(SUM(quantity_available), 0)::INTEGER as total_available,
    COALESCE(SUM(quantity_used_today), 0)::INTEGER as total_used_today,
    COALESCE(SUM(quantity_available * price), 0) as total_value
  FROM public.inventory_items;
END;
$$;

COMMENT ON FUNCTION reset_daily_quantities() IS 'Resetea las cantidades diarias de todos los productos al inicio del día';
COMMENT ON FUNCTION get_warehouse_stats(UUID) IS 'Obtiene estadísticas de inventario para una bodega específica';
COMMENT ON FUNCTION get_global_stats() IS 'Obtiene estadísticas globales de inventario de todas las bodegas';
