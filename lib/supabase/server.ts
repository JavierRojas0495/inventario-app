import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.SUPABASE_URL || "https://meykdavbhagnvcpocmjj.supabase.co"
  const supabaseKey = process.env.SUPABASE_ANON_KEY!

  if (!supabaseKey) {
    throw new Error("SUPABASE_ANON_KEY no está configurada. Por favor, configura las variables de entorno en .env.local")
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Puede ser ignorado si tienes proxy refrescando sesiones
        }
      },
    },
  })
}
