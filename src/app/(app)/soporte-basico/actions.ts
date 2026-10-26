"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { texto } from "@/lib/format";

function refrescar() {
  revalidatePath("/soporte-basico");
}

/** Acepta "123456", "#123456" o la URL completa del ticket. */
function leerTicket(fd: FormData) {
  const m = texto(fd, "ticket").match(/(\d{1,12})\/?\s*$/);
  return m ? m[1] : null;
}

function leerCaso(fd: FormData) {
  const empresa = Number(texto(fd, "empresa_id"));
  const ticket = leerTicket(fd);
  const fecha = texto(fd, "fecha");
  if (!empresa) return { error: "Elegí la empresa." } as const;
  if (!ticket) return { error: "Ingresá el número de ticket (solo números)." } as const;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fecha)) return { error: "Fecha y hora inválidas." } as const;
  return { datos: [empresa, ticket, fecha.replace("T", " "), texto(fd, "notas")] } as const;
}

async function ticketRepetido(ticket: string, excluirId = 0) {
  const otro = await queryOne<{ empresa: string; fecha: string }>(
    `select e.nombre as empresa, to_char(c.fecha, 'DD/MM/YYYY') as fecha
     from casos c join empresas_basico e on e.id = c.empresa_id where c.ticket = $1 and c.id <> $2`,
    [ticket, excluirId],
  );
  return otro ? { error: `El ticket ${ticket} ya está registrado (${otro.empresa}, ${otro.fecha}).` } : null;
}

export async function crearCaso(fd: FormData) {
  const usuario = await requireUsuario();
  const r = leerCaso(fd);
  if ("error" in r) return r;
  const repetido = await ticketRepetido(r.datos[1]);
  if (repetido) return repetido;
  await query("insert into casos (empresa_id, ticket, fecha, notas, usuario_id) values ($1, $2, $3, $4, $5)", [
    ...r.datos,
    usuario.id,
  ]);
  refrescar();
}

export async function editarCaso(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerCaso(fd);
  if ("error" in r) return r;
  const repetido = await ticketRepetido(r.datos[1], id);
  if (repetido) return repetido;
  await query("update casos set empresa_id = $2, ticket = $3, fecha = $4, notas = $5 where id = $1", [id, ...r.datos]);
  refrescar();
}

export async function borrarCaso(id: number) {
  await requireUsuario();
  await query("delete from casos where id = $1", [id]);
  refrescar();
}

// ---- Empresas con soporte Básico ----

function leerEmpresa(fd: FormData) {
  const nombre = texto(fd, "nombre").toUpperCase();
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  return { datos: [nombre, texto(fd, "notas")] } as const;
}

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

export async function crearEmpresa(fd: FormData) {
  await requireUsuario();
  const r = leerEmpresa(fd);
  if ("error" in r) return r;
  try {
    await query("insert into empresas_basico (nombre, notas) values ($1, $2)", [...r.datos]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Esa empresa ya está en la lista." };
    throw e;
  }
  refrescar();
}

export async function editarEmpresa(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerEmpresa(fd);
  if ("error" in r) return r;
  try {
    await query("update empresas_basico set nombre = $2, notas = $3, activa = $4 where id = $1", [
      id,
      ...r.datos,
      fd.get("activa") === "on",
    ]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe otra empresa con ese nombre." };
    throw e;
  }
  refrescar();
}

export async function borrarEmpresa(id: number) {
  await requireUsuario();
  const uso = await queryOne<{ n: number }>("select count(*)::int as n from casos where empresa_id = $1", [id]);
  if (uso?.n) return { error: `No se puede borrar: tiene ${uso.n} caso(s) registrados. Podés desactivarla (por ejemplo, si dejó el soporte Básico).` };
  await query("delete from empresas_basico where id = $1", [id]);
  refrescar();
}
