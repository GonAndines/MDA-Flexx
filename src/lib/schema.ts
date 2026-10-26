import bcrypt from "bcryptjs";
import type { Driver } from "./db";
import { seedBase, seedDemo } from "./seed";

/**
 * Versión del esquema. La 1 tenía planes, empresas, llamadas y tareas con valor;
 * esas tablas quedan sin uso en las bases que ya existían (no se borran).
 * La 2 tenía tipos_soporte y tareas_cotizables con valores de ejemplo: la 3 las reemplaza.
 */
const VERSION = 3;

const DDL = [
  `create table if not exists usuarios (
    id serial primary key,
    nombre text not null,
    email text not null unique,
    password_hash text not null,
    rol text not null default 'operador' check (rol in ('admin', 'operador')),
    activo boolean not null default true,
    creado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create table if not exists respuestas (
    id serial primary key,
    titulo text not null,
    categoria text not null default 'General',
    texto text not null,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create table if not exists empresas_basico (
    id serial primary key,
    nombre text not null unique,
    notas text not null default '',
    activa boolean not null default true
  )`,
  `create table if not exists casos (
    id serial primary key,
    empresa_id int not null references empresas_basico(id) on delete restrict,
    ticket bigint not null unique,
    fecha timestamp not null,
    notas text not null default '',
    usuario_id int references usuarios(id) on delete set null,
    creado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create index if not exists casos_empresa_fecha on casos (empresa_id, fecha)`,
  // Valores sin IVA. Cada tipo de soporte usa una tarifa (con soporte / sin soporte).
  `create table if not exists tarifas (
    id serial primary key,
    nombre text not null unique,
    visita_primera numeric(14, 2) not null,
    visita_restantes numeric(14, 2) not null,
    remota_hora numeric(14, 2) not null,
    orden int not null default 0,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create table if not exists tipos_soporte (
    id serial primary key,
    nombre text not null unique,
    tarifa_id int not null references tarifas(id),
    orden int not null default 0
  )`,
  `create table if not exists tareas_cotizables (
    id serial primary key,
    nombre text not null,
    descripcion text not null default '',
    orden int not null default 0,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
  // Qué se cotiza de cada tarea según el soporte: horas, no aplica (–), a cotizar o un valor fijo en pesos.
  `create table if not exists tarea_soporte (
    tarea_id int not null references tareas_cotizables(id) on delete cascade,
    tipo_id int not null references tipos_soporte(id) on delete cascade,
    modo text not null check (modo in ('horas', 'no_aplica', 'a_cotizar', 'fijo')),
    valor numeric(14, 2),
    primary key (tarea_id, tipo_id)
  )`,
  `create table if not exists novedades (
    id serial primary key,
    mes date not null,
    titulo text not null,
    texto text not null default '',
    usuario_id int references usuarios(id) on delete set null,
    creado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create index if not exists novedades_mes on novedades (mes)`,
  `create table if not exists informes (
    id serial primary key,
    titulo text not null,
    categoria text not null default 'General',
    contenido text not null default '',
    usuario_id int references usuarios(id) on delete set null,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create table if not exists schema_version (version int not null)`,
];

/** Crea o actualiza las tablas, carga los datos iniciales y el usuario admin. Corre una vez por arranque del servidor. */
export async function ensureSchema(d: Driver) {
  const [{ actual }] = await d.query(
    "select case when to_regclass('public.schema_version') is null then 0 else 1 end as actual",
  );
  let version = 0;
  if (actual) version = (await d.query("select coalesce(max(version), 0) as v from schema_version"))[0].v;

  if (version < VERSION) {
    const [{ nueva }] = await d.query("select to_regclass('public.usuarios') is null as nueva");
    // Las tablas del cotizador de la versión 2 tenían otra estructura y solo datos de ejemplo.
    if (version < 3) await d.query("drop table if exists tareas_cotizables, tipos_soporte cascade");
    for (const stmt of DDL) await d.query(stmt);
    await seedBase(d);
    if (nueva && process.env.SEED_DEMO !== "false") await seedDemo(d);
    await d.query("delete from schema_version");
    await d.query("insert into schema_version (version) values ($1)", [VERSION]);
  }

  const [{ n }] = await d.query("select count(*)::int as n from usuarios");
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (n === 0 && email && password) {
    await d.query(
      "insert into usuarios (nombre, email, password_hash, rol) values ($1, $2, $3, 'admin') on conflict (email) do nothing",
      ["Administrador", email, await bcrypt.hash(password, 10)],
    );
  }
}
