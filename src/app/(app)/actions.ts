"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUsuario } from "@/lib/auth";
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

// Contactos de las áreas (WhatsApp, teléfonos, mails).

const TIPOS_CONTACTO = ["whatsapp", "telefono", "email", "otro"];

function leerContacto(fd: FormData) {
  const area = texto(fd, "area");
  const tipo = texto(fd, "tipo");
  const valor = texto(fd, "valor");
  if (!area) return { error: "Indicá el área." } as const;
  if (!TIPOS_CONTACTO.includes(tipo)) return { error: "Elegí el tipo de contacto." } as const;
  if (!valor) return { error: "Completá el número o dirección." } as const;
  if ((tipo === "whatsapp" || tipo === "telefono") && valor.replace(/\D/g, "").length < 6) {
    return { error: "El número parece incompleto." } as const;
  }
  if (tipo === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) return { error: "El email no es válido." } as const;
  return { datos: [area, tipo, valor, texto(fd, "detalle")] } as const;
}

export async function crearContacto(fd: FormData) {
  await requireUsuario();
  const r = leerContacto(fd);
  if ("error" in r) return r;
  await query("insert into contactos (area, tipo, valor, detalle) values ($1, $2, $3, $4)", [...r.datos]);
  revalidatePath("/");
}

export async function editarContacto(id: number, fd: FormData) {
  await requireUsuario();
  const r = leerContacto(fd);
  if ("error" in r) return r;
  await query("update contactos set area = $2, tipo = $3, valor = $4, detalle = $5 where id = $1", [id, ...r.datos]);
  revalidatePath("/");
}

export async function borrarContacto(id: number) {
  await requireUsuario();
  await query("delete from contactos where id = $1", [id]);
  revalidatePath("/");
}

// Contraseñas fijas (Firebird, etc.). Las ve y copia cualquier usuario; solo el admin las cambia.

function leerClave(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const valor = texto(fd, "valor");
  if (!nombre) return { error: "Indicá el nombre." } as const;
  if (!valor) return { error: "Completá la contraseña." } as const;
  return { datos: [nombre, valor] } as const;
}

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

export async function crearClave(fd: FormData) {
  await requireAdmin();
  const r = leerClave(fd);
  if ("error" in r) return r;
  try {
    await query("insert into claves (nombre, valor, orden) values ($1, $2, (select coalesce(max(orden), 0) + 1 from claves))", [...r.datos]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe una contraseña con ese nombre." };
    throw e;
  }
  revalidatePath("/");
}

export async function editarClave(id: number, fd: FormData) {
  await requireAdmin();
  const r = leerClave(fd);
  if ("error" in r) return r;
  try {
    await query("update claves set nombre = $2, valor = $3 where id = $1", [id, ...r.datos]);
  } catch (e) {
    if (esDuplicado(e)) return { error: "Ya existe una contraseña con ese nombre." };
    throw e;
  }
  revalidatePath("/");
}

export async function borrarClave(id: number) {
  await requireAdmin();
  await query("delete from claves where id = $1", [id]);
  revalidatePath("/");
}
