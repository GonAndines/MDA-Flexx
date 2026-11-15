<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mesa de ayuda (MDA-Flexx)

## Cómo retomar

- `npm install` solo si falta `node_modules`.
- `npm run dev` → http://localhost:3000 (si el 3000 está ocupado, Next pasa al 3001).
- Antes de commitear, los dos chequeos tienen que dar 0: `npx tsc --noEmit` y `npx eslint .`.
- `.env.local` no está en el repo. `DATABASE_URL` vacío = PGlite en `./.data/pglite`. `AUTH_SECRET` es obligatorio en producción.

## Arquitectura en dos minutos

- Next.js 16 (App Router) + React 19 + Tailwind 4. Todo el acceso a datos pasa por `src/lib/db.ts`: `query`, `queryOne`, `transaction`.
- `transaction()` es **no interactiva**: las sentencias se arman antes de ejecutar. No sirve para leer un `returning` y usarlo en la sentencia siguiente.
- `src/proxy.ts` (no `middleware.ts`) hace el chequeo optimista de la cookie; la autorización real va en cada página y cada acción con `requireUsuario` / `requireAdmin`.
- Server Actions en el `actions.ts` de cada carpeta. Los formularios se validan con `texto()` y `numero()` de `src/lib/format.ts`.
- Postgres: PGlite en local, Neon en Vercel. Cualquier diferencia entre los dos motores es el principal riesgo del proyecto.

## Gotchas

- El driver se cachea en `globalThis`: después de cambiar la forma de `Driver` hay que **reiniciar** `next dev`, el HMR no lo recrea.
- `next dev` reescribe el bloque `BEGIN:nextjs-agent-rules` de este archivo. No lo borres.
- PowerShell mangla los acentos en los mensajes de commit: escribí el mensaje en un archivo UTF-8 y usá `git commit -F archivo`.
- Las carpetas con `_` son privadas en el App Router: no generan ruta.

## Reglas de negocio ya decididas

- El límite de 5 casos por mes del soporte Básico es **advisory**: se permite cargar el sexto y queda marcado como "excedido" para cotizarlo aparte. No bloquearlo en el servidor.
- Las fechas y horas de la app son de Argentina (UTC-3, sin horario de verano).

## Pendientes acordados

1. Rate limiting en el login (`src/app/login/actions.ts`).
2. Invalidar las sesiones abiertas al cambiar la contraseña (hoy el JWT dura 7 días y no se puede revocar).
3. Cabeceras de seguridad en `next.config.ts`: CSP, `X-Frame-Options`, `poweredByHeader: false`.
4. CI en GitHub Actions que corra `tsc` y `eslint` en cada push.
5. Probar en un preview de Vercel la rama de Neon de `transaction()` (guardar indicadores y crear un agente con nombre repetido).

