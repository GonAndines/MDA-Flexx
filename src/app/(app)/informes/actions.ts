"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { texto } from "@/lib/format";

function leer(fd: FormData) {
  const titulo = texto(fd, "titulo");
  if (!titulo) return { error: "El título es obligatorio." } as const;
  return { datos: [titulo, texto(fd, "categoria") || "General", texto(fd, "contenido")] } as const;
}

function refrescar() {
  revalidatePath("/informes", "layout");
  revalidatePath("/");
}

export async function crearInforme(fd: FormData) {
  const usuario = await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  const nuevo = await queryOne<{ id: number }>(
    "insert into informes (titulo, categoria, contenido, usuario_id) values ($1, $2, $3, $4) returning id",
    [...r.datos, usuario.id],
  );
  refrescar();
  redirect(`/informes/${nuevo!.id}`);
}

export async function editarInforme(id: number, fd: FormData) {
  const usuario = await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query(
    "update informes set titulo = $2, categoria = $3, contenido = $4, usuario_id = $5, actualizado = now() at time zone 'UTC' where id = $1",
    [id, ...r.datos, usuario.id],
  );
  refrescar();
}

export async function borrarInforme(id: number) {
  await requireUsuario();
  await query("delete from informes where id = $1", [id]);
  refrescar();
  redirect("/informes");
}
