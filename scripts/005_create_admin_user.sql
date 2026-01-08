-- Crear función para insertar usuario admin en public.users después de crear el usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para auto-crear perfil de usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANTE: Este usuario admin debe ser creado manualmente en Supabase Auth Dashboard
-- O puede usar la siguiente función para crear el usuario admin programáticamente

-- Nota: Para crear el usuario admin/admin, debes ir a:
-- Supabase Dashboard > Authentication > Users > Add user
-- Email: admin@admin.com
-- Password: admin
-- User Metadata: {"username": "admin", "full_name": "Administrador", "is_admin": true}

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un registro en public.users cuando se crea un usuario en auth.users';
