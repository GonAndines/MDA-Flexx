import { leerPrimeraHoja, posicion, referencia } from "./xlsx";

/** Indicadores mensuales de la mesa de ayuda (pestaña Indicadores, solo administradores). */
export const INDICADORES = {
  rings_perdidos: "Rings perdidos",
  llamadas_atendidas: "Llamadas atendidas",
  tickets_resueltos: "Tickets resueltos",
} as const;
export type Indicador = keyof typeof INDICADORES;
export const esIndicador = (v: unknown): v is Indicador => typeof v === "string" && v in INDICADORES;

export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
/** Días de la semana en el orden del gráfico; el número es el que se guarda (1 = lunes … 7 = domingo). */
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const normalizar = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
const NUM_MES = new Map(MESES.map((m, i) => [normalizar(m), i + 1]));
const NUM_DIA = new Map(DIAS.map((d, i) => [normalizar(d), i + 1]));

export type FilaRings = { mes: number; dia: number; valor: number };

/**
 * Lee la planilla "Indicadores Rings perdidos": un cuadro por mes con el nombre del mes en una celda,
 * debajo los títulos (Dia | Cant Ring Perdidos | % Semanal) y una fila por día de la semana.
 * El cuadro "ANUAL" y la columna de porcentaje se ignoran (la app los calcula).
 * Los meses que vienen todos en cero se toman como "sin cargar" y no se importan.
 */
export function leerRingsPerdidos(archivo: Buffer): { filas: FilaRings[]; meses: number[] } {
  const celdas = leerPrimeraHoja(archivo);
  const filas: FilaRings[] = [];
  const meses: number[] = [];

  for (const [ref, valor] of Object.entries(celdas)) {
    const mes = NUM_MES.get(normalizar(valor));
    if (!mes) continue;
    const { col, fila } = posicion(ref);
    const delMes: FilaRings[] = [];
    // Debajo del nombre del mes viene la fila de títulos y después los días; se corta en la primera fila sin día.
    for (let f = fila + 1; f <= fila + 10; f++) {
      const dia = NUM_DIA.get(normalizar(celdas[referencia(col, f)]));
      if (!dia) {
        if (f > fila + 1) break;
        continue;
      }
      const cantidad = Number(celdas[referencia(col + 1, f)] ?? 0);
      if (!Number.isFinite(cantidad) || cantidad < 0) throw new Error(`${MESES[mes - 1]}: la cantidad del ${DIAS[dia - 1].toLowerCase()} no es válida.`);
      delMes.push({ mes, dia, valor: Math.round(cantidad) });
    }
    if (delMes.some((x) => x.valor > 0)) {
      filas.push(...delMes);
      meses.push(mes);
    }
  }
  if (!meses.length) throw new Error("No encontré cuadros de meses con datos (un cuadro por mes con el nombre del mes arriba y los días debajo).");
  return { filas, meses: meses.sort((a, b) => a - b) };
}
