/** Casos por mes incluidos en el soporte Básico. */
export const LIMITE_CASOS_MES = 5;

export const IVA = 0.21;

export function ticketUrl(ticket: string | number) {
  return `https://soporte.flexxus.com.ar/tickets/${ticket}`;
}

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export function formatPesos(valor: number | string | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return pesos.format(Number(valor));
}

export function formatHoras(horas: number) {
  const h = Number(horas).toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return `${h} h${Number(horas) === 1 ? "" : "s"}`;
}

/** "2026-10-26T14:05" → "26/10/2026 14:05" */
export function formatFechaHora(iso: string) {
  const [fecha, hora = ""] = iso.split("T");
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a} ${hora}`.trim();
}

/** Fecha y hora actual de Argentina para un input datetime-local. */
export function ahoraArgentina() {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 16);
}

/** Mes actual de Argentina como "AAAA-MM". */
export function mesActual() {
  return ahoraArgentina().slice(0, 7);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-10" → "octubre 2026" */
export function nombreMes(mes: string) {
  const [a, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} ${a}`;
}

/** Suma `delta` meses a "AAAA-MM". */
export function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Valida "AAAA-MM" (de la URL o un formulario); si no es válido devuelve el mes actual. */
export function mesValido(v: string | undefined | null) {
  return v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : mesActual();
}

export function texto(fd: FormData, campo: string) {
  return String(fd.get(campo) ?? "").trim();
}

/** Número opcional de un formulario: vacío → null, inválido → NaN. */
export function numero(fd: FormData, campo: string): number | null {
  const v = texto(fd, campo).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
