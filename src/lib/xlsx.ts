import { inflateRawSync } from "node:zlib";

/**
 * Lector mínimo de .xlsx (sin dependencias): abre el zip, toma la primera hoja y devuelve sus celdas
 * como { "A1": "Enero", "B3": 36, ... }. Alcanza para planillas simples de valores; no evalúa fórmulas
 * (usa el último valor calculado que guardó Excel).
 */
export function leerPrimeraHoja(archivo: Buffer): Record<string, string | number> {
  const entradas = leerZip(archivo);
  const texto = (nombre: string) => {
    const e = entradas.get(nombre);
    return e ? e.toString("utf8") : null;
  };

  const compartidos: string[] = [];
  const ss = texto("xl/sharedStrings.xml");
  if (ss) {
    for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
      compartidos.push(decodificar((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
    }
  }

  const primera = [...entradas.keys()].filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
  const hoja = texto("xl/worksheets/sheet1.xml") ?? (primera ? texto(primera) : null);
  if (!hoja) throw new Error("El archivo no tiene hojas.");

  const celdas: Record<string, string | number> = {};
  for (const c of hoja.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
    const ref = c.match(/\br="([A-Z]+\d+)"/)?.[1];
    if (!ref) continue;
    const tipo = c.match(/\bt="(\w+)"/)?.[1];
    const v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1];
    if (tipo === "s" && v !== undefined) celdas[ref] = compartidos[Number(v)] ?? "";
    else if (tipo === "inlineStr") celdas[ref] = decodificar((c.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "").trim());
    else if (tipo === "str" && v !== undefined) celdas[ref] = decodificar(v);
    else if (v !== undefined && v !== "") celdas[ref] = Number(v);
  }
  return celdas;
}

/** "B12" → { col: 2, fila: 12 } y al revés. */
export const posicion = (ref: string) => {
  const [, letras, fila] = ref.match(/^([A-Z]+)(\d+)$/)!;
  return { col: [...letras].reduce((n, l) => n * 26 + l.charCodeAt(0) - 64, 0), fila: Number(fila) };
};
export const referencia = (col: number, fila: number) => {
  let letras = "";
  for (let n = col; n > 0; n = Math.floor((n - 1) / 26)) letras = String.fromCharCode(65 + ((n - 1) % 26)) + letras;
  return `${letras}${fila}`;
};

const decodificar = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** Entradas de un zip (directorio central), descomprimidas. Solo métodos 0 (sin compresión) y 8 (deflate). */
function leerZip(buf: Buffer) {
  let fin = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new Error("El archivo no es un .xlsx válido.");
  const cantidad = buf.readUInt16LE(fin + 10);
  let p = buf.readUInt32LE(fin + 16);
  const entradas = new Map<string, Buffer>();
  for (let n = 0; n < cantidad; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("El archivo .xlsx está dañado.");
    const metodo = buf.readUInt16LE(p + 10);
    const comprimido = buf.readUInt32LE(p + 20);
    const largoNombre = buf.readUInt16LE(p + 28);
    const largoExtra = buf.readUInt16LE(p + 30);
    const largoComentario = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nombre = buf.toString("utf8", p + 46, p + 46 + largoNombre);
    const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const datos = buf.subarray(inicio, inicio + comprimido);
    if (metodo === 0) entradas.set(nombre, datos);
    else if (metodo === 8) entradas.set(nombre, inflateRawSync(datos));
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return entradas;
}
