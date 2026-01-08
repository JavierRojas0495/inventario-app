import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.SUPABASE_URL || "https://meykdavbhagnvcpocmjj.supabase.co"
  const supabaseKey = process.env.SUPABASE_ANON_KEY!

  if (!supabaseKey) {
    throw new Error("SUPABASE_ANON_KEY no está configurada. Por favor, configura las variables de entorno en .env.local")
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas: redirigir a login si no hay usuario
  // Permitir acceso a rutas de prueba, API y setup
  const publicPaths = ["/auth", "/test-db", "/api", "/setup"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  
  if (!isPublicPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Si el usuario está autenticado y trata de acceder al login, redirigir al home
  if (request.nextUrl.pathname.startsWith("/auth/login") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
