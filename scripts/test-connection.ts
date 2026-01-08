// Script de prueba de conexión a Supabase
import { createClient } from "../lib/supabase/client"

async function testConnection() {
  console.log("🔍 Probando conexión a Supabase...\n")

  const supabase = createClient()

  try {
    // Test 1: Verificar autenticación
    console.log("1. Verificando servicio de autenticación...")
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log("   ⚠️  Error de autenticación:", authError.message)
    } else {
      console.log("   ✓ Servicio de autenticación disponible")
    }

    // Test 2: Verificar conexión a la base de datos - tabla users
    console.log("\n2. Verificando tabla 'users'...")
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("count")
      .limit(1)

    if (usersError) {
      console.log("   ✗ Error al consultar tabla 'users':", usersError.message)
      console.log("   Detalles:", usersError)
    } else {
      console.log("   ✓ Tabla 'users' accesible")
    }

    // Test 3: Verificar tabla warehouses
    console.log("\n3. Verificando tabla 'warehouses'...")
    const { data: warehousesData, error: warehousesError } = await supabase
      .from("warehouses")
      .select("count")
      .limit(1)

    if (warehousesError) {
      console.log("   ✗ Error al consultar tabla 'warehouses':", warehousesError.message)
    } else {
      console.log("   ✓ Tabla 'warehouses' accesible")
    }

    // Test 4: Verificar tabla inventory_items
    console.log("\n4. Verificando tabla 'inventory_items'...")
    const { data: itemsData, error: itemsError } = await supabase
      .from("inventory_items")
      .select("count")
      .limit(1)

    if (itemsError) {
      console.log("   ✗ Error al consultar tabla 'inventory_items':", itemsError.message)
    } else {
      console.log("   ✓ Tabla 'inventory_items' accesible")
    }

    // Test 5: Verificar tabla inventory_movements
    console.log("\n5. Verificando tabla 'inventory_movements'...")
    const { data: movementsData, error: movementsError } = await supabase
      .from("inventory_movements")
      .select("count")
      .limit(1)

    if (movementsError) {
      console.log("   ✗ Error al consultar tabla 'inventory_movements':", movementsError.message)
    } else {
      console.log("   ✓ Tabla 'inventory_movements' accesible")
    }

    // Resumen
    console.log("\n" + "=".repeat(50))
    const errors = [usersError, warehousesError, itemsError, movementsError].filter(Boolean)
    if (errors.length === 0) {
      console.log("✅ Conexión a la base de datos: EXITOSA")
      console.log("✅ Todas las tablas están accesibles")
    } else {
      console.log("⚠️  Conexión parcial:")
      console.log(`   - Tablas accesibles: ${4 - errors.length}/4`)
      console.log(`   - Errores encontrados: ${errors.length}`)
    }
    console.log("=".repeat(50))
  } catch (error) {
    console.error("\n❌ Error crítico:", error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error)
      process.exit(1)
    })
}

export { testConnection }
