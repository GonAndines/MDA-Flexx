"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUsuario } from "@/lib/auth";
import { AHORA_AR, query, queryOne } from "@/lib/db";
import { numero, texto } from "@/lib/format";

/** Sábados que cada agente puede tomar por tanda, para cada rol. */
const LIMITE_POR_TANDA = 2;

type Rol = "activa" | "pasiva";
const HOY = `(${AHORA_AR})::date`;

function refrescar() {
  revalidatePath("/");
}

function columnas(rol: Rol) {
  return rol === "activa" ? { col: "activa_id", otra: "pasiva_id" } : { col: "pasiva_id", otra: "activa_id" };
}

async function miAgente(usuarioId: number) {
  return queryOne<{ id: number; nombre: string }>("select id, nombre from agentes where usuario_id = $1 and activo", [usuarioId]);
}

// ---- Agente: postularse y liberar ----

export async function postularme(sabadoId: number, rol: Rol) {
  const usuario = await requireUsuario();
  const agente = await miAgente(usuario.id);
  if (!agente) return { error: "Tu usuario no está vinculado a ningún agente. Pedíselo a un administrador." };
  const { col, otra } = columnas(rol);

  const s = await queryOne<{ tanda: number; feriado: boolean; futuro: boolean; ocupado: boolean; otra: number | null }>(
    `select tanda, feriado, fecha > ${HOY} as futuro, ${col} is not null as ocupado, ${otra} as otra from sabados where id = $1`,
    [sabadoId],
  );
  if (!s) return { error: "Ese sábado ya no existe." };
  if (!s.futuro) return { error: "Solo podés postularte a sábados que todavía no pasaron." };
  if (s.feriado) return { error: "Ese sábado está marcado como feriado." };
  if (s.ocupado) return { error: "Ese lugar ya está tomado." };
  if (s.otra === agente.id) return { error: "No podés tener atención activa y pasiva el mismo sábado." };

  const ya = await queryOne<{ n: number }>(`select count(*)::int as n from sabados where tanda = $1 and ${col} = $2`, [s.tanda, agente.id]);
  if ((ya?.n ?? 0) >= LIMITE_POR_TANDA) {
    return { error: `Ya tenés ${LIMITE_POR_TANDA} sábados de atención ${rol} en este período.` };
  }

  // La condición "is null" evita pisar a alguien que se postuló al mismo tiempo.
  const ok = await queryOne(
    `update sabados set ${col} = $2 where id = $1 and ${col} is null and coalesce(${otra}, 0) <> $2 returning id`,
    [sabadoId, agente.id],
  );
  if (!ok) return { error: "Alguien tomó ese lugar recién. Actualizá la página." };
  refrescar();
}

export async function liberar(sabadoId: number, rol: Rol) {
  const usuario = await requireUsuario();
  const agente = await miAgente(usuario.id);
  if (!agente) return { error: "Tu usuario no está vinculado a ningún agente." };
  const { col } = columnas(rol);
  const ok = await queryOne(`update sabados set ${col} = null where id = $1 and ${col} = $2 and fecha > ${HOY} returning id`, [
    sabadoId,
    agente.id,
  ]);
  if (!ok) return { error: "Solo podés liberar tus propios sábados que todavía no pasaron." };
  refrescar();
}

// ---- Administrador ----

export async function asignarSabado(sabadoId: number, fd: FormData) {
  await requireAdmin();
  const feriado = fd.get("feriado") === "on";
  const activa = feriado ? null : Number(texto(fd, "activa_id")) || null;
  const pasiva = feriado ? null : Number(texto(fd, "pasiva_id")) || null;
  if (activa && activa === pasiva) return { error: "El agente activo y el pasivo tienen que ser distintos." };
  await query("update sabados set feriado = $2, activa_id = $3, pasiva_id = $4 where id = $1", [sabadoId, feriado, activa, pasiva]);
  refrescar();
}

export async function borrarSabado(sabadoId: number) {
  await requireAdmin();
  await query("delete from sabados where id = $1", [sabadoId]);
  refrescar();
}

/** Agrega N sábados seguidos a continuación del último (o desde el próximo sábado si el último ya pasó), como una tanda nueva. */
export async function agregarFechas(fd: FormData) {
  await requireAdmin();
  const n = numero(fd, "cantidad");
  if (n === null || !Number.isInteger(n) || n < 1 || n > 60) return { error: "Ingresá una cantidad entre 1 y 60." };
  await query(
    `with base as (
       select greatest(
                coalesce(max(fecha) + 7, ${HOY}),
                ${HOY} + ((6 - extract(dow from ${HOY})::int + 7) % 7)
              ) as desde,
              coalesce(max(tanda), 0) + 1 as tanda
       from sabados
     )
     insert into sabados (fecha, tanda)
     select (base.desde + 7 * i)::date, base.tanda from base, generate_series(0, $1::int - 1) as i`,
    [n],
  );
  refrescar();
}

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

function leerAgente(fd: FormData) {
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  return { nombre, usuario: Number(texto(fd, "usuario_id")) || null } as const;
}

export async function crearAgente(fd: FormData) {
  await requireAdmin();
  const r = leerAgente(fd);
  if ("error" in r) return r;
  try {
    await query("insert into agentes (nombre, usuario_id) values ($1, $2)", [r.nombre, r.usuario]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe ese agente, o el usuario ya está vinculado a otro agente." };
    throw e;
  }
  refrescar();
}

export async function editarAgente(id: number, fd: FormData) {
  await requireAdmin();
  const r = leerAgente(fd);
  if ("error" in r) return r;
  try {
    await query("update agentes set nombre = $2, usuario_id = $3, activo = $4 where id = $1", [
      id,
      r.nombre,
      r.usuario,
      fd.get("activo") === "on",
    ]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe ese nombre, o el usuario ya está vinculado a otro agente." };
    throw e;
  }
  refrescar();
}
