import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://meykdavbhagnvcpocmjj.supabase.co"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada. Por favor, configura las variables de entorno en .env.local")
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
