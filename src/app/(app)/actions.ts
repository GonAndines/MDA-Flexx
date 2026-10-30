"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUsuario } from "@/lib/auth";
import { query } from "@/lib/db";
import { texto } from "@/lib/format";

// Novedades del equipo: un día o un rango de fechas (vacaciones, carpeta médica, etc.), opcionalmente de una persona.
// Solo las carga el administrador; todos las ven en el calendario del Resumen.

const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

async function leer(fd: FormData) {
  const titulo = texto(fd, "titulo");
  const desde = texto(fd, "desde");
  const hasta = texto(fd, "hasta") || desde;
  const persona = texto(fd, "persona");
  if (!titulo) return { error: "El título es obligatorio." } as const;
  if (!FECHA.test(desde)) return { error: "Elegí la fecha (o la fecha de inicio)." } as const;
  if (!FECHA.test(hasta)) return { error: "La fecha de fin no es válida." } as const;
  if (hasta < desde) return { error: "La fecha de fin es anterior a la de inicio." } as const;
  let personaId: number | null = null;
  if (persona) {
    personaId = Number(persona);
    const [existe] = await query("select 1 from usuarios where id = $1", [personaId]);
    if (!existe) return { error: "La persona elegida no existe." } as const;
  }
  return { datos: [desde, hasta, personaId, titulo, texto(fd, "texto")] } as const;
}

export async function crearNovedad(fd: FormData) {
  const usuario = await requireAdmin();
  const r = await leer(fd);
  if ("error" in r) return r;
  await query(
    `insert into novedades (desde, hasta, persona_id, titulo, texto, mes, usuario_id)
     values ($1, $2, $3, $4, $5, date_trunc('month', $1::date), $6)`,
    [...r.datos, usuario.id],
  );
  revalidatePath("/");
}

export async function editarNovedad(id: number, fd: FormData) {
  await requireAdmin();
  const r = await leer(fd);
  if ("error" in r) return r;
  await query(
    `update novedades set desde = $2, hasta = $3, persona_id = $4, titulo = $5, texto = $6, mes = date_trunc('month', $2::date)
     where id = $1`,
    [id, ...r.datos],
  );
  revalidatePath("/");
}

export async function borrarNovedad(id: number) {
  await requireAdmin();
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
