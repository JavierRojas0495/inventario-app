import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://meykdavbhagnvcpocmjj.supabase.co"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseKey) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada")
    throw new Error("Error de configuración: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada. Por favor, verifica las variables de entorno.")
  }
  
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL no está configurada")
    throw new Error("Error de configuración: NEXT_PUBLIC_SUPABASE_URL no está configurada. Por favor, verifica las variables de entorno.")
  }
  
  try {
    return createBrowserClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error al crear cliente de Supabase:", error)
    throw new Error("Error al inicializar la conexión con la base de datos. Por favor, recarga la página.")
  }
}
