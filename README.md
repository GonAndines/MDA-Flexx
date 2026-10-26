# Mesa de ayuda

Herramienta interna de la mesa de ayuda: novedades del equipo, informes, registro de casos de soporte Básico, respuestas rápidas y cotizador de tareas adicionales.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres (Neon) · login con usuarios propios.

## Pestañas

| Pestaña | Qué hace |
|---|---|
| **Resumen** | Derivador de la central telefónica (IVR): cada destino muestra su secuencia (ej. Desarrollo = 2-1-3) y al tocarlo resalta el camino. El menú se edita en `src/lib/ivr.ts`. Debajo, novedades del equipo por mes (alta, edición y baja, navegando entre meses), **Contactos** de las áreas (WhatsApp, teléfonos y mails agrupados por área, con botón Copiar para pasárselos al cliente) e informes actualizados recientemente. |
| **Soporte Básico** | Lista de empresas con soporte Básico y sus casos del mes. Registrar un caso: empresa + número de ticket (se puede pegar la URL) + fecha. El ticket abre `https://soporte.flexxus.com.ar/tickets/<número>`. Cada empresa tiene **5 casos por mes calendario**: al llegar, la app avisa "sin llamadas disponibles" y el sexto en adelante queda marcado como excedido. No permite repetir un ticket. |
| **Respuestas rápidas** | Respuestas predefinidas con categorías, búsqueda (sin importar acentos), botón Copiar, alta, edición y baja. |
| **Cotizador** | Tabla de tareas cotizables con lo que se cotiza según el soporte (horas, "–" no aplica, a cotizar o valor fijo) y dos tarifas sin IVA: *con soporte* (Premium, Básico, Por Casos, Order Advanced) y *sin soporte*. Se elige tarea, soporte contratado y modalidad: **remota** = horas × valor hora; **visita** = primera hora + horas restantes × su valor. Muestra total + IVA, IVA 21 % y total con IVA, con botón para copiar. Se pueden agregar y editar tareas y tarifas. |
| **Informes** | Notas de release, uso del sistema, procedimientos, etc. Texto con formato (títulos, listas, negritas, tablas, links) con vista previa, búsqueda y categorías. |
| **Usuarios** | Solo administradores: alta de usuarios, rol (administrador u operador), activar/desactivar y cambio de contraseña. |
| **Mi cuenta** | Desde el enlace "Mi cuenta" del encabezado, cada usuario cambia su propia contraseña (pide la actual). |

El límite de casos (5) y el IVA (21 %) están en `src/lib/format.ts`.

## Correr en local

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
```

Completá en `.env.local` al menos `AUTH_SECRET` y `ADMIN_PASSWORD` (ver [variables de entorno](#variables-de-entorno)). Después:

```bash
npm run dev
```

Abrí http://localhost:3000 e ingresá con `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Si el puerto 3000 está ocupado: `npx next dev -p 3100`.

**Base de datos local:** si `DATABASE_URL` está vacía se usa [PGlite](https://pglite.dev), un Postgres embebido que guarda los datos en `./.data/pglite`. No hay que instalar nada. Para empezar de cero, frená el servidor y borrá la carpeta `.data`.

La primera vez que arranca, la aplicación crea las tablas y el usuario administrador, y carga las **15 empresas con soporte Básico**, las tarifas y la tabla de tareas cotizables vigentes. En una base nueva agrega además **datos de ejemplo** (respuestas, novedades, informes y algunos casos con tickets ficticios); con `SEED_DEMO=false` no se cargan.

**Actualización de bases existentes:** la base guarda su versión de esquema (tabla `schema_version`). Al desplegar una versión nueva, las tablas que faltan se crean solas en el primer acceso. Las tablas de la versión 1 (`planes`, `empresas`, `llamadas`, `tareas`) quedan sin uso y no se borran; se pueden eliminar a mano cuando ya no hagan falta.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | En Vercel, sí | Cadena de conexión de Postgres (Neon). La completa sola la integración de Neon. En local, vacía = PGlite. |
| `AUTH_SECRET` | Sí (en producción) | Clave para firmar las sesiones. Generala con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Si la cambiás, se cierran todas las sesiones. |
| `ADMIN_EMAIL` | Primera vez | Email del primer administrador. Solo se usa si no hay ningún usuario. |
| `ADMIN_PASSWORD` | Primera vez | Contraseña de ese administrador. Cambiala desde la pestaña Usuarios después de ingresar. |
| `SEED_DEMO` | No | `false` para no cargar datos de ejemplo. Por defecto `true`. |

## Desplegar en Vercel

1. **Subir el código a un repositorio** (GitHub, GitLab o Bitbucket).
2. En [vercel.com/new](https://vercel.com/new) importá el repositorio. Vercel detecta Next.js solo; no hace falta cambiar los comandos de build.
3. **Base de datos:** en el proyecto de Vercel, *Storage → Create Database → Neon (Serverless Postgres)* y conectala al proyecto (entornos Production y Preview). Esto crea `DATABASE_URL` automáticamente.
   - Alternativa: crear la base en [neon.tech](https://neon.tech) y pegar la cadena de conexión en `DATABASE_URL`.
4. **Variables de entorno** (*Settings → Environment Variables*): `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, si querés arrancar sin datos de ejemplo, `SEED_DEMO=false`.
5. **Deploy.** En el primer acceso la aplicación crea las tablas y el administrador. Ingresá, cambiá la contraseña del admin y creá los usuarios del equipo.

Con la CLI, en lugar de los pasos 2 a 5:

```bash
npm i -g vercel
vercel link
vercel env add AUTH_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD
vercel --prod
```

> En Vercel no se puede usar la base local (el disco es de solo lectura): sin `DATABASE_URL` la aplicación muestra un error explicándolo.

## Alta masiva de usuarios

`scripts/crear-usuarios.mjs` crea varios usuarios de una vez desde un CSV, con una contraseña temporal al azar para cada uno.

1. Copiá `usuarios.ejemplo.csv` como `usuarios.csv` y completá una fila por persona: `nombre;email;rol` (rol `admin` u `operador`; vacío = operador). Se puede armar en Excel y guardar como CSV.
2. Copiá la cadena de conexión de la base: en Vercel, *Storage → (tu base Neon) → .env.local* (o *Settings → Environment Variables → DATABASE_URL*).
3. En una terminal `cmd`, en la carpeta del proyecto (las comillas son necesarias porque la URL tiene `&`):

   ```bat
   set "DATABASE_URL=postgresql://...pegá acá la cadena completa..."
   node scripts/crear-usuarios.mjs usuarios.csv
   ```

4. Las contraseñas quedan en `usuarios-creados.csv`. Pasáselas a cada uno por un canal privado (y pediles que la cambien desde **Mi cuenta**) y después **borrá** ese archivo y `usuarios.csv`. Ninguno de los dos se sube a git.

Las filas vacías que agrega Excel al final (`;;;`) se ignoran.

Los emails que ya existen se saltean, así que se puede volver a correr sin duplicar. Sin `DATABASE_URL`, el script usa la base local de desarrollo (con `npm run dev` detenido).

## Estructura

```
src/
  proxy.ts               redirige al login si no hay sesión
  lib/
    db.ts                conexión (Neon o PGlite) y helpers de consulta
    schema.ts            tablas + creación del admin inicial
    seed.ts              datos de ejemplo
    auth.ts, session.ts  sesiones con cookie firmada (JWT) y contraseñas con bcrypt
  app/
    login/               pantalla de ingreso
    (app)/               pestañas: resumen (novedades), soporte-basico, respuestas, cotizador, informes, usuarios
  components/            diálogo de formularios, botones, navegación
```

Las horas se manejan en hora de Argentina (UTC−3).
