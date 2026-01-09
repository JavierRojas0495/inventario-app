# Sistema de Inventario

Aplicación web moderna para la gestión de inventario con soporte para múltiples bodegas, importación/exportación de datos, generación de reportes y gestión de usuarios. Desarrollada con Next.js 16, React 19, TypeScript y Supabase.

## 📋 Características

- ✅ **Gestión de Inventario**: Crear, editar, eliminar y buscar productos
- ✅ **Múltiples Bodegas**: Soporte para gestionar inventario en diferentes ubicaciones
- ✅ **Movimientos de Inventario**: Registro de entradas, salidas y ajustes
- ✅ **Importación/Exportación CSV**: Importar productos desde CSV y exportar datos
- ✅ **Generación de Reportes**: Exportar reportes en formato CSV, Word y PDF
- ✅ **Gestión de Usuarios**: Crear, editar y eliminar usuarios con roles de administrador
- ✅ **Autenticación Segura**: Sistema de login con Supabase Auth
- ✅ **Interfaz Moderna**: UI responsive con tema claro/oscuro
- ✅ **Historial de Movimientos**: Seguimiento completo de cambios en el inventario

## 🚀 Requisitos Previos

- **Node.js**: >= 20.9.0 (requerido para Next.js 16)
- **npm**: >= 9.0.0
- **Cuenta de Supabase**: Para base de datos y autenticación

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd inventario-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```env
   # Variables públicas (accesibles desde el navegador)
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

   # Variables del servidor (privadas)
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   ```

   ⚠️ **IMPORTANTE**: 
   - Obtén estas claves desde tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - La `SUPABASE_SERVICE_ROLE_KEY` es muy sensible, nunca la compartas públicamente
   - Las variables `NEXT_PUBLIC_*` son accesibles desde el navegador

4. **Configurar la base de datos**
   
   Ejecuta los scripts SQL en orden desde el dashboard de Supabase (SQL Editor):
   
   1. `scripts/001_create_users_table.sql` - Crea la tabla de usuarios
   2. `scripts/002_create_warehouses_table.sql` - Crea la tabla de bodegas
   3. `scripts/003_create_inventory_items_table.sql` - Crea la tabla de productos
   4. `scripts/004_create_inventory_movements_table.sql` - Crea la tabla de movimientos
   5. `scripts/005_create_admin_user.sql` - Crea funciones y triggers para usuarios
   6. `scripts/006_create_functions.sql` - Crea funciones de utilidad

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   
   Navega a [http://localhost:3000](http://localhost:3000)

## 🔐 Configuración Inicial

### Crear Usuario Administrador

1. Accede a `/setup` en tu aplicación
2. Completa el formulario con:
   - Email
   - Contraseña
   - Nombre de usuario
   - Nombre completo
   - Marca "Es administrador" si deseas crear un admin
3. El usuario se creará automáticamente en Supabase Auth

**Alternativa**: Puedes crear el usuario manualmente desde Supabase Dashboard:
- Ve a Authentication > Users > Add user
- Email: `admin@admin.com`
- Password: `admin`
- User Metadata: `{"username": "admin", "full_name": "Administrador", "is_admin": true}`

### Verificar Conexión a Base de Datos

Accede a `/test-db` para verificar que la conexión a Supabase esté funcionando correctamente.

## 📁 Estructura del Proyecto

```
inventario-app/
├── app/                      # Rutas y páginas de Next.js
│   ├── api/                  # API Routes
│   │   ├── create-admin/     # Endpoint para crear usuarios admin
│   │   └── delete-user/      # Endpoint para eliminar usuarios
│   ├── auth/                 # Páginas de autenticación
│   │   └── login/            # Página de login
│   ├── setup/                # Página de configuración inicial
│   ├── test-db/              # Página de prueba de conexión
│   ├── error.tsx             # Error Boundary
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Página principal (inventario)
├── components/               # Componentes React
│   ├── ui/                   # Componentes de UI (shadcn/ui)
│   ├── add-item-form.tsx     # Formulario para agregar productos
│   ├── csv-importer.tsx      # Importador de CSV
│   ├── inventory-table.tsx   # Tabla de inventario
│   ├── reports-generator.tsx # Generador de reportes
│   ├── user-management.tsx   # Gestión de usuarios
│   └── ...
├── lib/                      # Utilidades y helpers
│   ├── supabase/             # Clientes de Supabase
│   │   ├── client.ts         # Cliente del navegador
│   │   ├── server.ts         # Cliente del servidor
│   │   └── proxy.ts          # Middleware de sesión
│   ├── auth.ts               # Funciones de autenticación
│   ├── inventory.ts           # Funciones de inventario
│   └── ...
├── scripts/                  # Scripts SQL para la base de datos
│   ├── 001_create_users_table.sql
│   ├── 002_create_warehouses_table.sql
│   ├── 003_create_inventory_items_table.sql
│   ├── 004_create_inventory_movements_table.sql
│   ├── 005_create_admin_user.sql
│   └── 006_create_functions.sql
├── public/                   # Archivos estáticos
├── .env.local                # Variables de entorno (no versionado)
├── .gitignore                # Archivos ignorados por Git
├── .nvmrc                    # Versión de Node.js
├── netlify.toml              # Configuración de Netlify
├── next.config.mjs           # Configuración de Next.js
├── package.json              # Dependencias del proyecto
└── tsconfig.json             # Configuración de TypeScript
```

## 🗄️ Base de Datos

### Esquema de Tablas

#### `users`
- `id` (UUID): Referencia a `auth.users`
- `username` (TEXT): Nombre de usuario único
- `full_name` (TEXT): Nombre completo
- `is_admin` (BOOLEAN): Si es administrador
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `warehouses`
- `id` (UUID): Identificador único
- `name` (TEXT): Nombre de la bodega
- `location` (TEXT): Ubicación
- `manager` (TEXT): Responsable
- `phone` (TEXT): Teléfono
- `created_by` (UUID): Usuario creador
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `inventory_items`
- `id` (UUID): Identificador único
- `warehouse_id` (UUID): Referencia a bodega
- `code` (TEXT): Código del producto (único por bodega)
- `name` (TEXT): Nombre del producto
- `price` (DECIMAL): Precio
- `quantity_available` (INTEGER): Cantidad disponible
- `quantity_initial_today` (INTEGER): Cantidad inicial del día
- `quantity_used_today` (INTEGER): Cantidad usada hoy
- `last_reset_date` (DATE): Última fecha de reset
- `created_by` (UUID): Usuario creador
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `inventory_movements`
- `id` (UUID): Identificador único
- `item_id` (UUID): Referencia a producto
- `warehouse_id` (UUID): Referencia a bodega
- `movement_type` (TEXT): Tipo (entrada, salida, ajuste, creacion, edicion)
- `quantity_before` (INTEGER): Cantidad antes
- `quantity_change` (INTEGER): Cambio en cantidad
- `quantity_after` (INTEGER): Cantidad después
- `description` (TEXT): Descripción del movimiento
- `created_by` (UUID): Usuario creador
- `created_at` (TIMESTAMPTZ)

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que permiten:
- **SELECT**: Todos los usuarios autenticados pueden ver datos
- **INSERT**: Todos los usuarios autenticados pueden crear registros
- **UPDATE**: Todos los usuarios autenticados pueden actualizar
- **DELETE**: Depende de la tabla (algunas requieren ser admin o creador)

## 🎯 Uso

### Gestión de Productos

1. **Agregar Producto**:
   - Selecciona una bodega
   - Haz clic en "Agregar Producto"
   - Completa el formulario (código, nombre, cantidad, precio)
   - Guarda

2. **Editar Producto**:
   - Haz clic en el icono de editar en la tabla
   - Modifica los campos necesarios
   - Guarda los cambios

3. **Eliminar Producto**:
   - Haz clic en el icono de eliminar
   - Confirma la acción

4. **Registrar Movimientos**:
   - Haz clic en "Registrar Movimiento"
   - Selecciona el tipo (Entrada/Salida)
   - Ingresa la cantidad y descripción
   - Guarda

### Importación/Exportación

1. **Importar desde CSV**:
   - Haz clic en "Importar CSV"
   - Selecciona un archivo CSV con formato:
     ```
     Código,Nombre,Cantidad,Precio
     P001,Producto 1,10,100.50
     P002,Producto 2,20,200.00
     ```
   - El sistema validará y procesará los datos

2. **Exportar a CSV**:
   - Haz clic en "Generar Reportes"
   - Selecciona "Exportar CSV"
   - Se descargará un archivo con todos los productos

### Generación de Reportes

1. **Reporte CSV**: Exporta todos los productos en formato CSV
2. **Reporte Word**: Genera un documento Word con el inventario completo
3. **Reporte PDF**: Crea un PDF con productos y últimos movimientos

### Gestión de Usuarios (Solo Administradores)

1. **Crear Usuario**:
   - Ve a la pestaña "Usuarios"
   - Completa el formulario
   - Marca "Es administrador" si es necesario
   - Guarda

2. **Eliminar Usuario**:
   - Haz clic en el icono de eliminar
   - Confirma la acción

## 🚀 Despliegue

### Desplegar en Netlify

1. **Preparar el repositorio**:
   - Asegúrate de que todos los cambios estén commitados
   - El archivo `netlify.toml` ya está configurado

2. **Conectar a Netlify**:
   - Ve a [Netlify Dashboard](https://app.netlify.com)
   - Click en "Add new site" > "Import an existing project"
   - Selecciona tu proveedor de Git y autoriza
   - Selecciona el repositorio

3. **Configurar Variables de Entorno**:
   - Ve a **Site settings** > **Environment variables**
   - Agrega todas las variables de `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (márcala como "Sensitive")
   - ⚠️ **IMPORTANTE**: Después de agregar variables, haz un nuevo deploy

4. **Desplegar**:
   - Netlify detectará automáticamente Next.js
   - El build se ejecutará automáticamente
   - El proceso tomará 2-5 minutos

5. **Verificar**:
   - Accede a `https://tu-sitio.netlify.app/test-db` para verificar conexión
   - Accede a `https://tu-sitio.netlify.app/setup` para crear el primer usuario

### Configuración de Netlify

El archivo `netlify.toml` ya está configurado con:
- Node.js version: 20.9.0
- Build command: `npm run build`
- Publish directory: `.next`
- Headers de seguridad

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000

# Producción
npm run build        # Crea build de producción
npm run start          # Inicia servidor de producción

# Linting
npm run lint           # Ejecuta ESLint
```

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada"

**Solución**: Verifica que el archivo `.env.local` exista y contenga todas las variables necesarias. Reinicia el servidor de desarrollo después de agregar variables.

### Error: "Failed to fetch"

**Solución**: 
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correctamente configurada
- Verifica que las claves de Supabase sean correctas
- Asegúrate de estar usando la clave "anon" (pública), no la "service_role"

### Error: "Application error: a client-side exception has occurred"

**Solución**:
1. Abre la consola del navegador (F12) y revisa los errores
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que estés autenticado correctamente
4. Revisa las políticas RLS en Supabase

### Error al crear producto: "new row violates row-level security policy"

**Solución**:
- Verifica que el usuario esté autenticado
- Verifica las políticas RLS en Supabase Dashboard
- Asegúrate de que `created_by` tenga un valor válido

### Error: "Invalid Date" en reportes PDF

**Solución**: Este error ya está resuelto. Si persiste, verifica que los movimientos tengan `created_at` válido en la base de datos.

### Error al importar CSV: "El archivo CSV debe tener las columnas..."

**Solución**: 
- Asegúrate de que el CSV tenga las columnas: `Código`, `Nombre`, `Cantidad`, `Precio`
- El sistema acepta variantes con/sin acentos y en español/inglés
- Verifica que no haya caracteres especiales que rompan el formato

### Problemas de conexión a Supabase

1. Accede a `/test-db` para verificar la conexión
2. Revisa los logs de Supabase Dashboard
3. Verifica que las claves de API sean correctas
4. Asegúrate de que las tablas estén creadas correctamente

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 16.0.10
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **UI Components**: Radix UI + shadcn/ui
- **Estilos**: Tailwind CSS 4.x
- **Generación de PDF**: jsPDF + jsPDF-AutoTable
- **Iconos**: Lucide React
- **Formularios**: React Hook Form + Zod

## 📝 Notas Importantes

- ⚠️ **Nunca compartas** la `SUPABASE_SERVICE_ROLE_KEY` públicamente
- ⚠️ Las variables `NEXT_PUBLIC_*` son accesibles desde el navegador
- ✅ El archivo `.env.local` está en `.gitignore` y no se versiona
- ✅ Todas las tablas tienen Row Level Security (RLS) habilitado
- ✅ Los movimientos de inventario se registran automáticamente

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👥 Soporte

Para problemas o preguntas:
1. Revisa la sección de Troubleshooting
2. Verifica los logs en Supabase Dashboard
3. Revisa la consola del navegador para errores específicos

---

**Desarrollado con ❤️ usando Next.js y Supabase**
