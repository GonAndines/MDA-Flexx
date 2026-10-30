"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { esColor } from "@/lib/colores";
import { texto } from "@/lib/format";

const MIN_CLAVE = 8;

/** Color elegido para el calendario de novedades; vacío o desconocido = automático. */
const leerColor = (fd: FormData) => {
  const c = texto(fd, "color");
  return esColor(c) ? c : null;
};

export async function crearUsuario(fd: FormData) {
  await requireAdmin();
  const nombre = texto(fd, "nombre");
  const email = texto(fd, "email").toLowerCase();
  const clave = String(fd.get("password") ?? "");
  const rol = fd.get("rol") === "admin" ? "admin" : "operador";
  if (!nombre || !email) return { error: "Nombre y email son obligatorios." };
  if (clave.length < MIN_CLAVE) return { error: `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.` };
  if (await queryOne("select 1 from usuarios where email = $1", [email])) return { error: "Ya existe un usuario con ese email." };
  await query("insert into usuarios (nombre, email, password_hash, rol, color) values ($1, $2, $3, $4, $5)", [
    nombre,
    email,
    await bcrypt.hash(clave, 10),
    rol,
    leerColor(fd),
  ]);
  revalidatePath("/usuarios");
  revalidatePath("/");
}

export async function editarUsuario(id: number, fd: FormData) {
  const yo = await requireAdmin();
  const nombre = texto(fd, "nombre");
  const email = texto(fd, "email").toLowerCase();
  const clave = String(fd.get("password") ?? "");
  const rol = fd.get("rol") === "admin" ? "admin" : "operador";
  const activo = fd.get("activo") === "on";
  if (!nombre || !email) return { error: "Nombre y email son obligatorios." };
  if (id === yo.id && (!activo || rol !== "admin")) return { error: "No podés quitarte el rol de administrador ni desactivarte." };
  if (clave && clave.length < MIN_CLAVE) return { error: `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.` };
  if (await queryOne("select 1 from usuarios where email = $1 and id <> $2", [email, id])) {
    return { error: "Ya existe un usuario con ese email." };
  }
  await query("update usuarios set nombre = $2, email = $3, rol = $4, activo = $5, color = $6 where id = $1", [
    id,
    nombre,
    email,
    rol,
    activo,
    leerColor(fd),
  ]);
  if (clave) await query("update usuarios set password_hash = $2 where id = $1", [id, await bcrypt.hash(clave, 10)]);
  revalidatePath("/usuarios");
  revalidatePath("/");
}
