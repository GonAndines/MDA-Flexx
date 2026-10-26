"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { numero, texto } from "@/lib/format";

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

// ---- Tareas cotizables ----

function leerTarea(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const horas = numero(fd, "horas");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  if (horas === null || Number.isNaN(horas) || horas <= 0) return { error: "Ingresá una cantidad de horas válida." } as const;
  return { datos: [nombre, texto(fd, "descripcion"), horas] } as const;
}

export async function crearTarea(fd: FormData) {
  await requireUsuario();
  const r = leerTarea(fd);
  if ("error" in r) return r;
  await query("insert into tareas_cotizables (nombre, descripcion, horas) values ($1, $2, $3)", [...r.datos]);
  revalidatePath("/cotizador");
}

export async function editarTarea(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerTarea(fd);
  if ("error" in r) return r;
  await query(
    "update tareas_cotizables set nombre = $2, descripcion = $3, horas = $4, actualizado = now() at time zone 'UTC' where id = $1",
    [id, ...r.datos],
  );
  revalidatePath("/cotizador");
}

export async function borrarTarea(id: number) {
  await requireUsuario();
  await query("delete from tareas_cotizables where id = $1", [id]);
  revalidatePath("/cotizador");
}

// ---- Valor hora por tipo de soporte ----

function leerTipo(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const valor = numero(fd, "valor_hora");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  if (valor === null || Number.isNaN(valor) || valor < 0) return { error: "Ingresá un valor hora válido." } as const;
  return { datos: [nombre, valor] } as const;
}

export async function crearTipo(fd: FormData) {
  await requireUsuario();
  const r = leerTipo(fd);
  if ("error" in r) return r;
  try {
    await query(
      "insert into tipos_soporte (nombre, valor_hora, orden) values ($1, $2, (select coalesce(max(orden), 0) + 1 from tipos_soporte))",
      [...r.datos],
    );
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe ese tipo de soporte." };
    throw e;
  }
  revalidatePath("/cotizador");
}

export async function editarTipo(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerTipo(fd);
  if ("error" in r) return r;
  try {
    await query("update tipos_soporte set nombre = $2, valor_hora = $3, actualizado = now() at time zone 'UTC' where id = $1", [
      id,
      ...r.datos,
    ]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe ese tipo de soporte." };
    throw e;
  }
  revalidatePath("/cotizador");
}

export async function borrarTipo(id: number) {
  await requireUsuario();
  await query("delete from tipos_soporte where id = $1", [id]);
  revalidatePath("/cotizador");
}
