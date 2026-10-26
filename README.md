# Mesa de ayuda

Herramienta interna para administrar la mesa de ayuda: registro de llamadas de empresas, respuestas rápidas, valores de tareas adicionales y planes de soporte contratados.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres (Neon) · login con usuarios propios.

## Pestañas

| Pestaña | Qué hace |
|---|---|
| **Resumen** | Indicadores: llamadas de hoy, abiertas, llamadas del mes, empresas que superaron las llamadas de su plan. Llamadas por empresa (hoy / mes contra lo incluido / abiertas), abiertas más antiguas y empresas por plan. |
| **Llamadas** | Registrar llamadas (empresa, contacto, fecha/hora, motivo, estado, resolución). Filtros por empresa, estado y período, y cuenta de llamadas por empresa. Al elegir la empresa avisa si no tiene soporte o si ya usó las llamadas incluidas del mes. Guarda qué usuario registró cada llamada. |
| **Respuestas rápidas** | Respuestas predefinidas con categorías, búsqueda (sin importar acentos), botón Copiar, alta, edición y baja. |
| **Tareas adicionales** | Tabla de tareas con unidad y valor en pesos. Alta, edición, baja y ajuste masivo por porcentaje. |
| **Planes y empresas** | Qué incluye cada tipo de soporte (horario, tiempo de respuesta, llamadas por mes, abono) y qué plan tiene cada empresa, con las llamadas usadas en el mes. |
| **Usuarios** | Solo administradores: alta de usuarios, rol (administrador u operador), activar/desactivar y cambio de contraseña. |

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

La primera vez que arranca con una base vacía, la aplicación crea las tablas, carga los **datos de ejemplo** (planes, 8 empresas ficticias, ~45 llamadas, respuestas y tareas) y el usuario administrador. Con `SEED_DEMO=false` crea las tablas vacías (solo el administrador).

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
    (app)/               pestañas: resumen, llamadas, respuestas, tareas, planes, usuarios
  components/            diálogo de formularios, botones, navegación
```

Las horas se manejan en hora de Argentina (UTC−3).
