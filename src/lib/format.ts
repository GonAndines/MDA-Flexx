const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export function formatPesos(valor: number | string | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return pesos.format(Number(valor));
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

export const ESTADOS = {
  pendiente: { label: "Pendiente", clase: "bg-amber-100 text-amber-800" },
  en_curso: { label: "En curso", clase: "bg-blue-100 text-blue-800" },
  resuelta: { label: "Resuelta", clase: "bg-emerald-100 text-emerald-800" },
} as const;

export type Estado = keyof typeof ESTADOS;

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
