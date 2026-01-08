# Guía de Despliegue en Netlify

## ✅ Respuesta Rápida

**Sí, puedes subir la aplicación a Netlify tal como está.** Solo necesitas configurar las variables de entorno en el dashboard de Netlify. La aplicación usará automáticamente la misma base de datos de Supabase que estás usando en desarrollo.

## Variables de Entorno Requeridas

Debes configurar las siguientes variables de entorno en el dashboard de Netlify:

### Variables Públicas (NEXT_PUBLIC_*)
Estas variables son accesibles desde el navegador y se incluyen en el bundle del cliente:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://meykdavbhagnvcpocmjj.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leWtkYXZiaGFnbnZjcG9jbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE2MTcsImV4cCI6MjA4MzQ3NzYxN30.YC6uXgYKqSxDt9ILSVOXwIxupmMCu_JJ0o4YvVlalwA`

### Variables del Servidor (Privadas)
Estas variables solo están disponibles en el servidor (API routes, Server Components):

- `SUPABASE_URL` = `https://meykdavbhagnvcpocmjj.supabase.co`
- `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leWtkYXZiaGFnbnZjcG9jbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE2MTcsImV4cCI6MjA4MzQ3NzYxN30.YC6uXgYKqSxDt9ILSVOXwIxupmMCu_JJ0o4YvVlalwA`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leWtkYXZiaGFnbnZjcG9jbWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkwMTYxNywiZXhwIjoyMDgzNDc3NjE3fQ.xoSge2go_dQG6TvqOVkSdxHESGaugWqAzNOZPh4NfGw`

⚠️ **IMPORTANTE**: La `SUPABASE_SERVICE_ROLE_KEY` es muy sensible. Asegúrate de marcarla como "Sensitive" en Netlify para que no se muestre en los logs.

## Pasos para Desplegar

### 1. Preparar el Repositorio
- Asegúrate de que todos los cambios estén commitados y pusheados a tu repositorio
- El archivo `netlify.toml` ya está incluido y configurado

### 2. Conectar tu Repositorio a Netlify
- Ve a [Netlify Dashboard](https://app.netlify.com)
- Click en "Add new site" > "Import an existing project"
- Selecciona tu proveedor de Git (GitHub, GitLab, Bitbucket)
- Autoriza a Netlify y selecciona tu repositorio

### 3. Configurar Variables de Entorno
**CRÍTICO**: Debes hacer esto ANTES del primer deploy

- En la configuración del sitio, ve a **Site settings** > **Environment variables**
- Click en "Add a variable" y agrega cada una de las variables listadas arriba
- **IMPORTANTE**: 
  - Marca `SUPABASE_SERVICE_ROLE_KEY` como "Sensitive" (checkbox)
  - Verifica que todas las variables estén escritas correctamente
  - No dejes espacios extra al inicio o final

### 4. Configurar Build Settings (Opcional)
Netlify debería detectar automáticamente Next.js, pero puedes verificar:

- **Build command**: `npm run build` (o `npm install && npm run build`)
- **Publish directory**: `.next` (Netlify lo detecta automáticamente)
- **Node version**: 18 (especificado en `.nvmrc`)

### 5. Desplegar
- Click en "Deploy site"
- Netlify:
  - Instalará las dependencias (`npm install`)
  - Ejecutará el build (`npm run build`)
  - Desplegará la aplicación
- El proceso tomará aproximadamente 2-5 minutos

## Notas Importantes

- ✅ **La aplicación usará la misma base de datos de Supabase** que estás usando en desarrollo
- ✅ **No necesitas cambiar ninguna configuración en el código** - todo está listo
- ✅ Las variables de entorno se cargarán automáticamente desde Netlify
- ✅ El archivo `netlify.toml` ya está configurado con las opciones correctas
- ⚠️ Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurada correctamente para que la funcionalidad de crear usuarios admin funcione
- ⚠️ Si cambias las variables de entorno después del deploy, necesitarás hacer un nuevo deploy para que los cambios surtan efecto

## Verificación Post-Deploy

Después del despliegue, verifica:

1. Accede a `https://tu-sitio.netlify.app/test-db` para verificar la conexión a la base de datos
2. Accede a `https://tu-sitio.netlify.app/setup` si necesitas crear el usuario admin
3. Prueba el login con las credenciales: `admin@admin.com` / `admin`

## Troubleshooting

Si encuentras problemas:

- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Netlify
- Asegúrate de que el Node.js version sea 18 o superior
- Verifica que el plugin `@netlify/plugin-nextjs` se haya instalado correctamente
