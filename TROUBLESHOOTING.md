# Guía de Troubleshooting - Errores en Producción

## Error: "Application error: a client-side exception has occurred"

Este error generalmente ocurre cuando hay un problema con:
1. Variables de entorno no configuradas
2. Autenticación fallida
3. Problemas con Row Level Security (RLS) en Supabase
4. Errores no capturados en el código

### Solución 1: Verificar Variables de Entorno en Netlify

1. Ve a Netlify Dashboard > Tu sitio > Site settings > Environment variables
2. Verifica que TODAS estas variables estén configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **IMPORTANTE**: Después de agregar/modificar variables de entorno, debes hacer un **nuevo deploy** para que los cambios surtan efecto.

### Solución 2: Verificar la Consola del Navegador

1. Abre la consola del navegador (F12 o Clic derecho > Inspeccionar > Console)
2. Busca errores en rojo
3. Los errores más comunes son:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined`
   - `Failed to fetch`
   - `Invalid API key`

### Solución 3: Verificar Autenticación

1. Asegúrate de estar autenticado correctamente
2. Si el error ocurre al crear un producto, verifica:
   - Que tengas una sesión activa
   - Que el usuario tenga permisos en Supabase

### Solución 4: Verificar Row Level Security (RLS) en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a Authentication > Policies
3. Verifica que las políticas RLS estén configuradas correctamente:
   - `inventory_items_insert_authenticated` debe permitir INSERT a usuarios autenticados
   - `inventory_movements_insert_authenticated` debe permitir INSERT a usuarios autenticados

### Solución 5: Verificar Logs de Netlify

1. Ve a Netlify Dashboard > Tu sitio > Deploys
2. Click en el último deploy
3. Revisa los logs de build para ver si hay errores

### Solución 6: Probar la Conexión

1. Accede a `https://tu-sitio.netlify.app/test-db`
2. Esto verificará si la conexión a Supabase está funcionando
3. Si todas las pruebas pasan, el problema puede estar en el código específico

## Errores Comunes y Soluciones

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada"
**Solución**: Agrega la variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Netlify y haz un nuevo deploy.

### Error: "Failed to fetch"
**Solución**: 
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correctamente configurada
- Verifica que no haya problemas de CORS (debería estar resuelto con Supabase)

### Error: "Invalid API key"
**Solución**: 
- Verifica que las claves de Supabase sean correctas
- Asegúrate de usar la clave "anon" (pública), no la "service_role" (privada) en las variables NEXT_PUBLIC_*

### Error al crear producto: "new row violates row-level security policy"
**Solución**: 
- Verifica que el usuario esté autenticado
- Verifica las políticas RLS en Supabase
- Asegúrate de que `created_by` tenga un valor válido (UUID del usuario)

## Verificación Rápida

Ejecuta estos pasos en orden:

1. ✅ Verificar variables de entorno en Netlify
2. ✅ Hacer un nuevo deploy después de cambiar variables
3. ✅ Verificar consola del navegador para errores específicos
4. ✅ Probar conexión en `/test-db`
5. ✅ Verificar que estás autenticado
6. ✅ Revisar logs de Netlify

## Contacto y Soporte

Si el problema persiste después de seguir estos pasos:
1. Revisa los logs de Netlify
2. Revisa la consola del navegador
3. Verifica las políticas RLS en Supabase
4. Asegúrate de que todas las tablas estén creadas correctamente
