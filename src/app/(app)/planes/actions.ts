"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { numero, texto } from "@/lib/format";

function refrescar() {
  revalidatePath("/planes");
  revalidatePath("/llamadas");
  revalidatePath("/");
}

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

// ---- Planes ----

function leerPlan(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const llamadas = numero(fd, "llamadas_mes");
  const abono = numero(fd, "abono_mensual");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  if (Number.isNaN(llamadas) || (llamadas !== null && llamadas < 0)) return { error: "Llamadas por mes inválido." } as const;
  if (Number.isNaN(abono) || (abono !== null && abono < 0)) return { error: "Abono mensual inválido." } as const;
  return {
    datos: [
      nombre,
      texto(fd, "descripcion"),
      texto(fd, "incluye"),
      texto(fd, "horario"),
      texto(fd, "tiempo_respuesta"),
      llamadas === null ? null : Math.round(llamadas),
      abono,
    ],
  } as const;
}

export async function crearPlan(fd: FormData) {
  await requireUsuario();
  const r = leerPlan(fd);
  if ("error" in r) return r;
  try {
    await query(
      `insert into planes (nombre, descripcion, incluye, horario, tiempo_respuesta, llamadas_mes, abono_mensual, orden)
       values ($1, $2, $3, $4, $5, $6, $7, (select coalesce(max(orden), 0) + 1 from planes))`,
      [...r.datos],
    );
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe un plan con ese nombre." };
    throw e;
  }
  refrescar();
}

export async function editarPlan(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerPlan(fd);
  if ("error" in r) return r;
  try {
    await query(
      `update planes set nombre = $2, descripcion = $3, incluye = $4, horario = $5, tiempo_respuesta = $6,
       llamadas_mes = $7, abono_mensual = $8 where id = $1`,
      [id, ...r.datos],
    );
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe un plan con ese nombre." };
    throw e;
  }
  refrescar();
}

export async function borrarPlan(id: number) {
  await requireUsuario();
  const uso = await queryOne<{ n: number }>("select count(*)::int as n from empresas where plan_id = $1", [id]);
  if (uso?.n) return { error: `No se puede borrar: ${uso.n} empresa(s) tienen este plan. Cambiales el plan primero.` };
  await query("delete from planes where id = $1", [id]);
  refrescar();
}

// ---- Empresas ----

function leerEmpresa(fd: FormData) {
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  const plan = texto(fd, "plan_id");
  return {
    datos: [
      nombre,
      texto(fd, "cuit"),
      texto(fd, "contacto"),
      texto(fd, "telefono"),
      texto(fd, "email"),
      plan ? Number(plan) : null,
      texto(fd, "notas"),
      fd.get("activa") === "on",
    ],
  } as const;
}

export async function crearEmpresa(fd: FormData) {
  await requireUsuario();
  const r = leerEmpresa(fd);
  if ("error" in r) return r;
  try {
    await query(
      "insert into empresas (nombre, cuit, contacto, telefono, email, plan_id, notas, activa) values ($1, $2, $3, $4, $5, $6, $7, $8)",
      [...r.datos],
    );
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe una empresa con ese nombre." };
    throw e;
  }
  refrescar();
}

export async function editarEmpresa(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerEmpresa(fd);
  if ("error" in r) return r;
  try {
    await query(
      `update empresas set nombre = $2, cuit = $3, contacto = $4, telefono = $5, email = $6, plan_id = $7, notas = $8, activa = $9
       where id = $1`,
      [id, ...r.datos],
    );
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe una empresa con ese nombre." };
    throw e;
  }
  refrescar();
}

export async function borrarEmpresa(id: number) {
  await requireUsuario();
  const uso = await queryOne<{ n: number }>("select count(*)::int as n from llamadas where empresa_id = $1", [id]);
  if (uso?.n) return { error: `No se puede borrar: tiene ${uso.n} llamada(s) registradas. Podés marcarla como inactiva.` };
  await query("delete from empresas where id = $1", [id]);
  refrescar();
}
