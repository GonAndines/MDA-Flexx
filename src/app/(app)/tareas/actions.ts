"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { numero, texto } from "@/lib/format";

function leer(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const valor = numero(fd, "valor");
  if (!nombre) return { error: "El nombre es obligatorio." } as const;
  if (valor === null || Number.isNaN(valor) || valor < 0) return { error: "Ingresá un valor válido." } as const;
  return { datos: [nombre, texto(fd, "descripcion"), texto(fd, "unidad") || "unidad", valor] } as const;
}

export async function crearTarea(fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query("insert into tareas (nombre, descripcion, unidad, valor) values ($1, $2, $3, $4)", [...r.datos]);
  revalidatePath("/tareas");
}

export async function editarTarea(id: number, fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query(
    "update tareas set nombre = $2, descripcion = $3, unidad = $4, valor = $5, actualizado = now() at time zone 'UTC' where id = $1",
    [id, ...r.datos],
  );
  revalidatePath("/tareas");
}

export async function borrarTarea(id: number) {
  await requireUsuario();
  await query("delete from tareas where id = $1", [id]);
  revalidatePath("/tareas");
}

/** Ajusta todos los valores por un porcentaje (por ejemplo, actualización por inflación). */
export async function ajustarValores(fd: FormData) {
  await requireUsuario();
  const pct = numero(fd, "porcentaje");
  if (pct === null || Number.isNaN(pct) || pct <= -100) return { error: "Ingresá un porcentaje válido." };
  await query(
    "update tareas set valor = round(valor * (1 + $1::numeric / 100), 2), actualizado = now() at time zone 'UTC'",
    [pct],
  );
  revalidatePath("/tareas");
}
