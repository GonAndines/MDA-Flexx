"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { texto } from "@/lib/format";

function leer(fd: FormData) {
  const titulo = texto(fd, "titulo");
  const categoria = texto(fd, "categoria") || "General";
  const contenido = texto(fd, "texto");
  if (!titulo || !contenido) return { error: "El título y el texto son obligatorios." } as const;
  return { datos: [titulo, categoria, contenido] } as const;
}

export async function crearRespuesta(fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query("insert into respuestas (titulo, categoria, texto) values ($1, $2, $3)", [...r.datos]);
  revalidatePath("/respuestas");
}

export async function editarRespuesta(id: number, fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query(
    "update respuestas set titulo = $2, categoria = $3, texto = $4, actualizado = now() at time zone 'UTC' where id = $1",
    [id, ...r.datos],
  );
  revalidatePath("/respuestas");
}

export async function borrarRespuesta(id: number) {
  await requireUsuario();
  await query("delete from respuestas where id = $1", [id]);
  revalidatePath("/respuestas");
}
