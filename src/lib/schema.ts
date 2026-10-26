import bcrypt from "bcryptjs";
import type { Driver } from "./db";
import { seed } from "./seed";

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
  `create table if not exists planes (
    id serial primary key,
    nombre text not null unique,
    descripcion text not null default '',
    incluye text not null default '',
    horario text not null default '',
    tiempo_respuesta text not null default '',
    llamadas_mes int,
    abono_mensual numeric(14, 2),
    orden int not null default 0
  )`,
  `create table if not exists empresas (
    id serial primary key,
    nombre text not null unique,
    cuit text not null default '',
    contacto text not null default '',
    telefono text not null default '',
    email text not null default '',
    plan_id int references planes(id) on delete set null,
    notas text not null default '',
    activa boolean not null default true
  )`,
  `create table if not exists llamadas (
    id serial primary key,
    empresa_id int not null references empresas(id) on delete restrict,
    contacto text not null default '',
    fecha timestamp not null,
    motivo text not null,
    estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'resuelta')),
    resolucion text not null default '',
    usuario_id int references usuarios(id) on delete set null,
    creado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create index if not exists llamadas_empresa_fecha on llamadas (empresa_id, fecha)`,
  `create index if not exists llamadas_fecha on llamadas (fecha)`,
  `create table if not exists respuestas (
    id serial primary key,
    titulo text not null,
    categoria text not null default 'General',
    texto text not null,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
  `create table if not exists tareas (
    id serial primary key,
    nombre text not null,
    descripcion text not null default '',
    unidad text not null default 'hora',
    valor numeric(14, 2) not null default 0,
    actualizado timestamp not null default (now() at time zone 'UTC')
  )`,
];

/** Crea las tablas si no existen, carga los datos de ejemplo la primera vez y el usuario admin inicial. */
export async function ensureSchema(d: Driver) {
  const [{ existe }] = await d.query("select to_regclass('public.tareas') is not null as existe");
  if (!existe) {
    for (const stmt of DDL) await d.query(stmt);
    if (process.env.SEED_DEMO !== "false") await seed(d);
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
