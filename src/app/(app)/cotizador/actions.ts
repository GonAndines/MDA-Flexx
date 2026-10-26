"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { numero, texto } from "@/lib/format";

const MODOS = ["horas", "no_aplica", "a_cotizar", "fijo"] as const;
type Modo = (typeof MODOS)[number];

// ---- Tareas cotizables (con lo que se cotiza para cada tipo de soporte) ----

async function leerTarea(fd: FormData) {
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "El nombre de la tarea es obligatorio." } as const;
  const tipos = await query<{ id: number; nombre: string }>("select id, nombre from tipos_soporte order by orden");
  const celdas: [number, Modo, number | null][] = [];
  for (const t of tipos) {
    const modo = texto(fd, `modo_${t.id}`) as Modo;
    if (!MODOS.includes(modo)) return { error: `Elegí qué se cotiza para ${t.nombre}.` } as const;
    const valor = numero(fd, `valor_${t.id}`);
    if (modo === "horas" && (valor === null || Number.isNaN(valor) || valor <= 0)) {
      return { error: `Ingresá las horas para ${t.nombre}.` } as const;
    }
    if (modo === "fijo" && valor !== null && (Number.isNaN(valor) || valor < 0)) {
      return { error: `El valor fijo para ${t.nombre} no es válido.` } as const;
    }
    celdas.push([t.id, modo, modo === "horas" || modo === "fijo" ? valor : null]);
  }
  return { nombre, descripcion: texto(fd, "descripcion"), celdas } as const;
}

async function guardarCeldas(tareaId: number, celdas: [number, Modo, number | null][]) {
  await query("delete from tarea_soporte where tarea_id = $1", [tareaId]);
  if (!celdas.length) return;
  const values = celdas.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(", ");
  await query(`insert into tarea_soporte (tarea_id, tipo_id, modo, valor) values ${values}`, [tareaId, ...celdas.flat()]);
}

export async function crearTarea(fd: FormData) {
  await requireUsuario();
  const r = await leerTarea(fd);
  if ("error" in r) return r;
  const nueva = await queryOne<{ id: number }>(
    `insert into tareas_cotizables (nombre, descripcion, orden)
     values ($1, $2, (select coalesce(max(orden), 0) + 1 from tareas_cotizables)) returning id`,
    [r.nombre, r.descripcion],
  );
  await guardarCeldas(nueva!.id, r.celdas);
  revalidatePath("/cotizador");
}

export async function editarTarea(id: number, fd: FormData) {
  await requireUsuario();
  const r = await leerTarea(fd);
  if ("error" in r) return r;
  await query(
    "update tareas_cotizables set nombre = $2, descripcion = $3, actualizado = now() at time zone 'UTC' where id = $1",
    [id, r.nombre, r.descripcion],
  );
  await guardarCeldas(id, r.celdas);
  revalidatePath("/cotizador");
}

export async function borrarTarea(id: number) {
  await requireUsuario();
  await query("delete from tareas_cotizables where id = $1", [id]);
  revalidatePath("/cotizador");
}

// ---- Tarifas (sin IVA) ----

export async function editarTarifa(id: number, fd: FormData) {
  await requireUsuario();
  const valores = ["visita_primera", "visita_restantes", "remota_hora"].map((c) => numero(fd, c));
  if (valores.some((v) => v === null || Number.isNaN(v) || v < 0)) return { error: "Completá los tres valores con números válidos." };
  await query(
    `update tarifas set visita_primera = $2, visita_restantes = $3, remota_hora = $4, actualizado = now() at time zone 'UTC'
     where id = $1`,
    [id, ...valores],
  );
  revalidatePath("/cotizador");
}
