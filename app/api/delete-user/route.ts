import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 })
    }

    // Usar Service Role Key para eliminar el usuario
    const supabaseUrl = process.env.SUPABASE_URL || "https://meykdavbhagnvcpocmjj.supabase.co"
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY no está configurada" },
        { status: 500 }
      )
    }

    // Crear cliente con Service Role Key (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Eliminar usuario de auth.users (esto también eliminará automáticamente de public.users por CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      // Si falla eliminar de auth, intentar solo eliminar de public.users
      const { error: profileError } = await supabaseAdmin.from("users").delete().eq("id", userId)
      
      if (profileError) {
        return NextResponse.json({ error: deleteError.message || profileError.message }, { status: 400 })
      }
      
      // Si solo se eliminó de public.users, retornar advertencia
      return NextResponse.json({
        success: true,
        message: "Usuario eliminado de la base de datos (pero no de autenticación)",
        warning: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    })
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar usuario" }, { status: 500 })
  }
}
