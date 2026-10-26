"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { texto } from "@/lib/format";

// Novedades del equipo (se muestran en el Resumen, agrupadas por mes).

function leer(fd: FormData) {
  const titulo = texto(fd, "titulo");
  const mes = texto(fd, "mes");
  if (!titulo) return { error: "El título es obligatorio." } as const;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { error: "Elegí el mes." } as const;
  return { datos: [`${mes}-01`, titulo, texto(fd, "texto")] } as const;
}

export async function crearNovedad(fd: FormData) {
  const usuario = await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query("insert into novedades (mes, titulo, texto, usuario_id) values ($1, $2, $3, $4)", [...r.datos, usuario.id]);
  revalidatePath("/");
}

export async function editarNovedad(id: number, fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query("update novedades set mes = $2, titulo = $3, texto = $4 where id = $1", [id, ...r.datos]);
  revalidatePath("/");
}

export async function borrarNovedad(id: number) {
  await requireUsuario();
  await query("delete from novedades where id = $1", [id]);
  revalidatePath("/");
}
