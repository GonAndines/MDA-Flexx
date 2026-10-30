/** Fechas como "AAAA-MM-DD" (en UTC, sin horas), para armar el calendario del mes. */

const sumarDias = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

/** Semanas (de lunes a domingo) que cubren el mes "AAAA-MM", incluidos los días de los meses vecinos. */
export function semanasDelMes(mes: string): string[][] {
  const primero = `${mes}-01`;
  const lunes = sumarDias(primero, -((new Date(primero).getUTCDay() + 6) % 7));
  const semanas: string[][] = [];
  for (let inicio = lunes; inicio.slice(0, 7) <= mes; inicio = sumarDias(inicio, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i)));
  }
  return semanas;
}

/** Primer y último día que muestra el calendario del mes. */
export function rangoCalendario(mes: string) {
  const semanas = semanasDelMes(mes);
  return { desde: semanas[0][0], hasta: semanas.at(-1)![6] };
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-11-01", "2026-11-10" → "1 al 10 de noviembre"; un solo día → "12 de noviembre". */
export function textoRango(desde: string, hasta: string) {
  const [ad, md, dd] = desde.split("-").map(Number);
  const [ah, mh, dh] = hasta.split("-").map(Number);
  if (desde === hasta) return `${dd} de ${MESES[md - 1]}`;
  if (ad === ah && md === mh) return `${dd} al ${dh} de ${MESES[mh - 1]}`;
  if (ad === ah) return `${dd} de ${MESES[md - 1]} al ${dh} de ${MESES[mh - 1]}`;
  return `${dd}/${md}/${ad} al ${dh}/${mh}/${ah}`;
}
