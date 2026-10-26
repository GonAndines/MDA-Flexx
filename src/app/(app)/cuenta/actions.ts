"use server";

import bcrypt from "bcryptjs";
import { requireUsuario } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

const MIN_CLAVE = 8;

export type CambioClaveState = { ok?: boolean; error?: string } | null;

export async function cambiarClave(_prev: CambioClaveState, fd: FormData): Promise<CambioClaveState> {
  const usuario = await requireUsuario();
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const repetida = String(fd.get("repetida") ?? "");

  if (nueva.length < MIN_CLAVE) return { error: `La nueva contraseña debe tener al menos ${MIN_CLAVE} caracteres.` };
  if (nueva !== repetida) return { error: "La nueva contraseña y su repetición no coinciden." };
  if (nueva === actual) return { error: "La nueva contraseña tiene que ser distinta de la actual." };

  const u = await queryOne<{ password_hash: string }>("select password_hash from usuarios where id = $1", [usuario.id]);
  if (!u || !(await bcrypt.compare(actual, u.password_hash))) return { error: "La contraseña actual no es correcta." };

  await query("update usuarios set password_hash = $2 where id = $1", [usuario.id, await bcrypt.hash(nueva, 10)]);
  return { ok: true };
}
