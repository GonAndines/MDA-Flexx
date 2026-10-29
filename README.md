# Mesa de ayuda

Herramienta interna de la mesa de ayuda: derivador de la central, atención de los sábados, contactos de las áreas, novedades del equipo, informes, registro de casos de soporte Básico, respuestas rápidas y cotizador de tareas adicionales.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres (Neon) · login con usuarios propios.

## Pestañas

| Pestaña | Qué hace |
|---|---|
| **Resumen** | Pantalla principal: derivador IVR, atención de los sábados, novedades del mes, contraseñas, contactos de las áreas e informes recientes. Detalle en [Resumen](#resumen). |
| **Soporte Básico** | Lista de empresas con soporte Básico y sus casos del mes. Registrar un caso: empresa + número de ticket (se puede pegar la URL) + fecha. El ticket abre `https://soporte.flexxus.com.ar/tickets/<número>`. Cada empresa tiene **5 casos por mes calendario**: al llegar, la app avisa "sin llamadas disponibles" y el sexto en adelante queda marcado como excedido. No permite repetir un ticket. |
| **Respuestas rápidas** | Respuestas predefinidas con categorías, búsqueda (sin importar acentos), botón Copiar, alta, edición y baja. |
| **Cotizador** | Tabla de tareas cotizables con lo que se cotiza según el soporte (horas, "–" no aplica, a cotizar o valor fijo) y dos tarifas sin IVA: *con soporte* (Premium, Básico, Por Casos, Order Advanced) y *sin soporte*. Se elige tarea, soporte contratado y modalidad: **remota** = horas × valor hora; **visita** = primera hora + horas restantes × su valor. Muestra total + IVA, IVA 21 % y total con IVA, con botón para copiar. Se pueden agregar y editar tareas y tarifas. |
| **Informes** | Notas de release, uso del sistema, procedimientos, etc., agrupados por **categoría**: la portada muestra una tarjeta por categoría con su cantidad, y al entrar se listan solo los de esa categoría, del más nuevo al más viejo. Búsqueda (sin importar acentos) dentro de la categoría o en todos. Texto con formato (títulos, listas, negritas, tablas, links) con vista previa. |
| **Usuarios** | Solo administradores: alta de usuarios, rol (administrador u operador), activar/desactivar y cambio de contraseña. |
| **Mi cuenta** | Desde el enlace "Mi cuenta" del encabezado, cada usuario cambia su propia contraseña (pide la actual). |
| **Modo oscuro** | El botón **☾ Modo oscuro / ☀ Modo claro** de la barra lateral (en el celular, el ícono de arriba) cambia el tema de toda la plataforma. Cada usuario elige el suyo y queda guardado en su navegador (cookie `tema`). |

El límite de casos (5) y el IVA (21 %) están en `src/lib/format.ts`.

## Resumen

### Derivador de la central (IVR)

Diagrama del menú de la central (0351-5685000, interno 7777). Cada destino muestra la secuencia de teclas (por ejemplo, **Desarrollo = 2-1-3**) y al tocarlo se resalta el camino completo. El menú se edita en `src/lib/ivr.ts`.

### Atención de los sábados

Cronograma con el agente de atención **activa** y el de atención **pasiva** de cada sábado.

- El **próximo sábado** aparece destacado arriba, con sus dos agentes. Los sábados que ya pasaron quedan plegados ("Ver sábados anteriores").
- **Agentes:** cada usuario de la plataforma, administradores incluidos, es agente automáticamente.
- **Postularse:** cada agente se anota solo con el botón **Postularme**, hasta **2 sábados de atención activa y 2 de pasiva por período**. No puede tener activa y pasiva el mismo sábado. Con **Liberar** suelta un sábado propio que todavía no pasó. Arriba de la tabla cada uno ve cuántos lleva en el período actual.
- **Administrador:**
  - **+ Agregar fechas:** agrega los próximos N sábados (14 por defecto) a continuación del último. Cada carga es un **período** nuevo, con su propio cupo de postulaciones.
  - **Editar** en cada sábado: asigna o cambia los agentes, o lo marca como **feriado** (sin atención). También puede quitar un sábado del cronograma.
  - **Agentes de los sábados** (al pie del cuadro): lista de agentes y el usuario vinculado a cada uno. Desde ahí se vinculan nombres a usuarios, se renombran y se desactivan agentes.
- **Cronograma inicial:** la base arranca con los sábados de febrero a noviembre de 2026 (planilla SABADOS.xlsx). Los nombres de esa planilla (Carol, Karen, Gaston, Rodrigo, Agustin, Martin, TiTa, Gonzalo, Fer) se vinculan solos al usuario cuyo **primer nombre** coincide, y así ese usuario conserva su historial. Los que no coinciden (apodos como "Fer" o "TiTa") el administrador los vincula a mano: *Agentes de los sábados → Editar → Usuario de la plataforma*. Si al usuario ya se le había creado un agente propio sin sábados, ese duplicado se borra al vincularlo.

El cupo por período está en `src/app/(app)/sabados-actions.ts` (`LIMITE_POR_TANDA`).

### Novedades del mes

Novedades del equipo agrupadas por mes, con flechas para navegar entre meses. Cualquier usuario puede agregar, editar y borrar.

### Contraseñas

Cada agente escribe el **usuario de Flexxus** (por ejemplo, ADMIN) y la app calcula las contraseñas del día, con la fecha de Argentina:

- **Pass Flexxus vieja:** año + mes + día sumados, `!` y el usuario. El 27/10/2026 con ADMIN: `2063!ADMIN`.
- **Pass Flexxus nueva:** año, `*`, mes + día sumados, `*` y el usuario. El 27/10/2026 con ADMIN: `2026*37*ADMIN`.

Debajo están las contraseñas fijas (Firebird 2.5, Firebird 5). Todas tienen botón **Copiar**. El navegador recuerda el último usuario ingresado. Las fórmulas están en `src/app/(app)/Claves.tsx`.

Las contraseñas fijas se guardan en la base, no en el código: el administrador las agrega, edita o borra desde el mismo cuadro (**+ Contraseña**).

### Contactos de las áreas

WhatsApp, teléfonos, mails y otros datos de Soporte, Administración y demás áreas, agrupados por área. Cada dato se muestra como texto con un botón **Copiar**, para pasárselo al cliente; no abre WhatsApp ni el correo. Se agregan, editan y borran desde el mismo cuadro.

### Informes recientes

Los últimos informes actualizados, con acceso directo a cada uno.

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

La primera vez que arranca, la aplicación crea las tablas y el usuario administrador, y carga las **15 empresas con soporte Básico**, las tarifas, la tabla de tareas cotizables vigentes y el **cronograma de sábados** inicial. En una base nueva agrega además **datos de ejemplo** (respuestas, novedades, informes y algunos casos con tickets ficticios); con `SEED_DEMO=false` no se cargan.

**Actualización de bases existentes:** la base guarda su versión de esquema (tabla `schema_version`, hoy versión 6). Al desplegar una versión nueva, las tablas que faltan se crean y se cargan solas en el primer acceso, sin tocar los datos existentes. Las tablas de la versión 1 (`planes`, `empresas`, `llamadas`, `tareas`) quedan sin uso y no se borran; se pueden eliminar a mano cuando ya no hagan falta.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | En Vercel, sí | Cadena de conexión de Postgres (Neon). La completa sola la integración de Neon. En local, vacía = PGlite. |
| `AUTH_SECRET` | Sí (en producción) | Clave para firmar las sesiones. Generala con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Si la cambiás, se cierran todas las sesiones. |
| `ADMIN_EMAIL` | Primera vez | Email del primer administrador. Solo se usa si no hay ningún usuario. |
| `ADMIN_PASSWORD` | Primera vez | Contraseña de ese administrador. Cambiala desde **Mi cuenta** después de ingresar. |
| `SEED_DEMO` | No | `false` para no cargar datos de ejemplo. Por defecto `true`. |

## Desplegar en Vercel

1. **Subir el código a un repositorio** (GitHub, GitLab o Bitbucket).
2. En [vercel.com/new](https://vercel.com/new) importá el repositorio. Vercel detecta Next.js solo; no hace falta cambiar los comandos de build.
3. **Base de datos:** en el proyecto de Vercel, *Storage → Create Database → Neon (Serverless Postgres)* y conectala al proyecto (entornos Production y Preview). Esto crea `DATABASE_URL` automáticamente.
   - Alternativa: crear la base en [neon.tech](https://neon.tech) y pegar la cadena de conexión en `DATABASE_URL`.
4. **Variables de entorno** (*Settings → Environment Variables*): `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, si querés arrancar sin datos de ejemplo, `SEED_DEMO=false`.
5. **Deploy.** En el primer acceso la aplicación crea las tablas y el administrador. Ingresá, cambiá la contraseña del admin y creá los usuarios del equipo (a mano o con el [alta masiva](#alta-masiva-de-usuarios)).
6. **Sábados:** en *Resumen → Atención de los sábados → Agentes de los sábados*, vinculá los nombres que quedaron "Sin vincular" a su usuario.
7. **Contraseñas:** en *Resumen → Contraseñas*, cargá las contraseñas fijas con **+ Contraseña**.

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

### Publicar cambios

Vercel despliega solo cada vez que se sube un cambio a la rama `main`. Desde una terminal en la carpeta del proyecto:

```bash
git push
```

En *Deployments* se ve el avance; en uno o dos minutos pasa a *Ready*. Con `git status` se ve si quedó algo sin subir (`Your branch is ahead of 'origin/main'`).

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

Cada usuario nuevo queda como agente de los sábados la próxima vez que alguien abre el Resumen.

## Importar informes

`scripts/importar-informes.mjs` carga varios informes de una vez desde un JSON. Se usó para pasar a **Notas de release** los Cierres Funcionales que manda Vanessa Segura por mail (el contenido del Word adjunto, sin la parte técnica).

```bat
set "DATABASE_URL=postgresql://...pegá acá la cadena completa..."
node scripts/importar-informes.mjs notas-release.json
```

El JSON es una lista de `{ "titulo", "contenido", "fecha": "AAAA-MM-DD", "categoria" }` (fecha y categoría son opcionales; la categoría por defecto es "Notas de release" o la que se pase como segundo argumento). La fecha queda como fecha del informe, así se ordenan como se publicaron. Los que ya existen (mismo título y categoría) se saltean, así que se puede volver a correr con mails nuevos sin duplicar. `notas-release.json` no se sube a git.

## Estructura

```
scripts/
  crear-usuarios.mjs     alta masiva de usuarios desde CSV
  importar-informes.mjs  carga de informes desde JSON
src/
  proxy.ts               redirige al login si no hay sesión
  lib/
    db.ts                conexión (Neon o PGlite) y helpers de consulta
    schema.ts            tablas, versión del esquema y admin inicial
    seed.ts              datos base (empresas Básico, tarifas, tareas, sábados) y de ejemplo
    agentes.ts           vincula usuarios con agentes de los sábados
    ivr.ts               menú de la central telefónica
    format.ts            límite de casos, IVA, formatos de fecha y moneda
    informes.ts          categorías, consulta y búsqueda de informes
    auth.ts, session.ts  sesiones con cookie firmada (JWT) y contraseñas con bcrypt
  app/
    login/               pantalla de ingreso
    (app)/               resumen (IVR, sábados, novedades, contactos), soporte-basico, respuestas,
                         cotizador, informes, usuarios, cuenta
  components/            diálogo de formularios, botones, navegación, IVR, editor Markdown
```

Las horas se manejan en hora de Argentina (UTC−3).

## Cambios desde la primera versión

| Fecha | Cambio |
|---|---|
| 26/10/2026 | **Versión inicial.** |
| 26/10/2026 | **Soporte Básico** reemplaza a *Planes y empresas* y *Llamadas*: casos con número de ticket enlazado a soporte.flexxus.com.ar y aviso al llegar a 5 casos por mes. Se quitaron *Tareas adicionales*. |
| 26/10/2026 | **Resumen** sin estadísticas de llamadas: ahora muestra novedades del mes e informes. Nueva pestaña **Informes**. |
| 26/10/2026 | **Cotizador** con las tarifas y la matriz de tareas vigentes (horas, no aplica, a cotizar o valor fijo según el soporte), total + IVA, y alta/edición de tareas y tarifas. |
| 26/10/2026 | La conexión usa solo `DATABASE_URL` (se quitó la alternativa `POSTGRES_URL`). |
| 26/10/2026 | **Alta masiva de usuarios** por script desde CSV. |
| 26/10/2026 | **Mi cuenta:** cada usuario cambia su propia contraseña. |
| 26/10/2026 | **Derivador IVR** de la central en el Resumen. |
| 26/10/2026 | **Contactos de las áreas** en el Resumen, con botón Copiar. |
| 27/10/2026 | **Atención de los sábados** en el Resumen, con el cronograma 2026 cargado, postulación de agentes (2 activos y 2 pasivos por período) y carga de nuevas fechas por el administrador. Todos los usuarios de la plataforma son agentes. |
| 27/10/2026 | **Informes por categoría:** portada con una tarjeta por categoría y listado filtrado al entrar. Importación de los Cierres Funcionales de Vanessa Segura como **Notas de release** (`scripts/importar-informes.mjs`). |
| 27/10/2026 | **Contraseñas** en el Resumen: Flexxus vieja y nueva calculadas con la fecha y el usuario ingresado, y contraseñas fijas (Firebird) que carga el administrador. Todas se copian con un botón. |
| 27/10/2026 | **Modo oscuro** opcional, con un botón en el encabezado. Se recuerda por navegador. |
| 29/10/2026 | **Rediseño visual:** navegación en barra lateral, paleta petróleo sobre grises verdosos (también en oscuro), tipografía Atkinson Hyperlegible (distingue l/1/I y 0/O al dictar contraseñas) y, en el Resumen, Contraseñas y Contactos fijos a la derecha al scrollear. Sin cambios de funcionalidad. |
