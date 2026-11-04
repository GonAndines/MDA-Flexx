"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { DIAS, leerRingsPerdidos, type Indicador } from "@/lib/indicadores";

type Fila = { indicador: Indicador; anio: number; mes: number; dia: number; valor: number };

/** Inserta o reemplaza valores (un solo insert con todas las filas). */
async function guardar(filas: Fila[]) {
  if (!filas.length) return;
  const valores = filas.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(", ");
  await query(
    `insert into indicadores (indicador, anio, mes, dia_semana, valor) values ${valores}
     on conflict (indicador, anio, mes, dia_semana) do update set valor = excluded.valor`,
    filas.flatMap((f) => [f.indicador, f.anio, f.mes, f.dia, f.valor]),
  );
}

const anioValido = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null;
};

/** Importa la planilla de rings perdidos (un cuadro por mes, con el detalle por día de la semana). */
export async function importarRings(fd: FormData) {
  await requireAdmin();
  const anio = anioValido(fd.get("anio"));
  const archivo = fd.get("archivo");
  if (!anio) return { error: "Indicá el año al que corresponde la planilla." };
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elegí el archivo .xlsx." };
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) return { error: "El archivo tiene que ser .xlsx (Excel). Si es .xls, guardalo como .xlsx." };

  let leidos;
  try {
    leidos = leerRingsPerdidos(Buffer.from(await archivo.arrayBuffer()));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo leer el archivo." };
  }
  // Cada mes importado reemplaza su detalle completo (por si antes tenía un día que ahora no viene).
  await query(`delete from indicadores where indicador = 'rings_perdidos' and anio = $1 and mes = any($2::int[])`, [anio, leidos.meses]);
  await guardar(leidos.filas.map((f) => ({ indicador: "rings_perdidos", anio, mes: f.mes, dia: f.dia, valor: f.valor })));
  revalidatePath("/indicadores");
}

const cantidad = (fd: FormData, campo: string) => {
  const t = String(fd.get(campo) ?? "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

/** Carga o corrige a mano un mes: rings perdidos por día, llamadas atendidas y tickets resueltos (vacío = sin dato). */
export async function guardarMes(anio: number, mes: number, fd: FormData) {
  await requireAdmin();
  if (!anioValido(anio) || mes < 1 || mes > 12) return { error: "Mes inválido." };

  const rings = DIAS.map((_, i) => cantidad(fd, `dia${i + 1}`));
  const llamadas = cantidad(fd, "llamadas_atendidas");
  const tickets = cantidad(fd, "tickets_resueltos");
  if ([...rings, llamadas, tickets].some((n) => Number.isNaN(n))) {
    return { error: "Las cantidades tienen que ser números enteros, sin decimales ni negativos." };
  }

  await query("delete from indicadores where anio = $1 and mes = $2", [anio, mes]);
  const filas: Fila[] = [];
  if (rings.some((n) => n !== null)) rings.forEach((n, i) => filas.push({ indicador: "rings_perdidos", anio, mes, dia: i + 1, valor: n ?? 0 }));
  if (llamadas !== null) filas.push({ indicador: "llamadas_atendidas", anio, mes, dia: 0, valor: llamadas });
  if (tickets !== null) filas.push({ indicador: "tickets_resueltos", anio, mes, dia: 0, valor: tickets });
  await guardar(filas);
  revalidatePath("/indicadores");
}
