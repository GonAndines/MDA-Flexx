"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { ESTADOS, texto } from "@/lib/format";

function leer(fd: FormData) {
  const empresa = Number(texto(fd, "empresa_id"));
  const fecha = texto(fd, "fecha");
  const motivo = texto(fd, "motivo");
  const estado = texto(fd, "estado") || "pendiente";
  if (!empresa) return { error: "Elegí la empresa." } as const;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fecha)) return { error: "Fecha y hora inválidas." } as const;
  if (!motivo) return { error: "El motivo es obligatorio." } as const;
  if (!(estado in ESTADOS)) return { error: "Estado inválido." } as const;
  return { datos: [empresa, texto(fd, "contacto"), fecha.replace("T", " "), motivo, estado, texto(fd, "resolucion")] } as const;
}

function refrescar() {
  revalidatePath("/llamadas");
  revalidatePath("/planes");
  revalidatePath("/");
}

export async function crearLlamada(fd: FormData) {
  const usuario = await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query(
    "insert into llamadas (empresa_id, contacto, fecha, motivo, estado, resolucion, usuario_id) values ($1, $2, $3, $4, $5, $6, $7)",
    [...r.datos, usuario.id],
  );
  refrescar();
}

export async function editarLlamada(id: number, fd: FormData) {
  await requireUsuario();
  const r = leer(fd);
  if ("error" in r) return r;
  await query(
    "update llamadas set empresa_id = $2, contacto = $3, fecha = $4, motivo = $5, estado = $6, resolucion = $7 where id = $1",
    [id, ...r.datos],
  );
  refrescar();
}

export async function borrarLlamada(id: number) {
  await requireUsuario();
  await query("delete from llamadas where id = $1", [id]);
  refrescar();
}
