import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, fullName } = body

    if (!email || !password || !username || !fullName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Usar Service Role Key para crear el usuario directamente
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

    // Verificar si el usuario ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)

    if (existingUser) {
      // Si el usuario existe, actualizar su metadata y perfil
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          username,
          full_name: fullName,
          is_admin: true,
        },
      })

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      // Actualizar o crear perfil en public.users
      const { error: profileError } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            id: existingUser.id,
            username,
            full_name: fullName,
            is_admin: true,
          },
          { onConflict: "id" }
        )

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: "Usuario actualizado exitosamente",
        userId: existingUser.id,
      })
    }

    // Crear nuevo usuario
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        username,
        full_name: fullName,
        is_admin: true,
      },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    // Crear perfil en public.users
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: newUser.user.id,
      username,
      full_name: fullName,
      is_admin: true,
    })

    if (profileError) {
      // Si falla crear el perfil, intentar actualizar
      await supabaseAdmin
        .from("users")
        .upsert(
          {
            id: newUser.user.id,
            username,
            full_name: fullName,
            is_admin: true,
          },
          { onConflict: "id" }
        )
    }

    return NextResponse.json({
      success: true,
      message: "Usuario creado exitosamente",
      userId: newUser.user.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear usuario" }, { status: 500 })
  }
}
