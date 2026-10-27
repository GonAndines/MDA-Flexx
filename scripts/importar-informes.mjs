// Importación de informes desde un JSON (por ejemplo, las notas de release extraídas de los mails).
//
// Uso:  node scripts/importar-informes.mjs notas-release.json ["Notas de release"]
//
// El JSON es una lista de objetos con: titulo, contenido (Markdown) y, opcionales, fecha (AAAA-MM-DD) y categoria.
// La categoría del segundo argumento se usa para los que no traen una (por defecto "Notas de release").
// La fecha queda como "actualizado", así el listado respeta el orden en que se publicaron.
//
// Con DATABASE_URL definida escribe en esa base (Neon/Vercel). Sin ella, en la base local de desarrollo (.data/pglite).
// Los informes que ya existen (mismo título y categoría) se saltean, así que se puede volver a correr sin duplicar.

import { readFileSync } from "node:fs";

const [archivo, categoriaPorDefecto = "Notas de release"] = process.argv.slice(2);
if (!archivo) {
  console.error('Uso: node scripts/importar-informes.mjs informes.json ["Categoría"]');
  process.exit(1);
}

// ---- Leer el JSON ----
let lista;
try {
  lista = JSON.parse(readFileSync(archivo, "utf8").replace(/^﻿/, ""));
} catch (e) {
  console.error(`No se pudo leer ${archivo}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(lista)) {
  console.error("El JSON tiene que ser una lista de informes.");
  process.exit(1);
}

const informes = [];
const errores = [];
lista.forEach((x, i) => {
  const titulo = typeof x?.titulo === "string" ? x.titulo.trim() : "";
  const fecha = typeof x?.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha) ? x.fecha : null;
  if (!titulo) errores.push(`Elemento ${i + 1}: falta el título`);
  else if (x.fecha && !fecha) errores.push(`Elemento ${i + 1}: fecha "${x.fecha}" inválida (AAAA-MM-DD)`);
  else informes.push({ titulo, categoria: x.categoria?.trim() || categoriaPorDefecto, contenido: String(x.contenido ?? ""), fecha });
});

if (errores.length) {
  console.error("Revisá el JSON:\n  " + errores.join("\n  "));
  process.exit(1);
}

// ---- Conexión ----
let query;
let cerrar = async () => {};
if (process.env.DATABASE_URL) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  query = (text, params) => sql.query(text, params);
  console.log("Base: DATABASE_URL (Neon)");
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(process.env.PGLITE_DIR ?? "./.data/pglite");
  query = async (text, params) => (await pg.query(text, params)).rows;
  cerrar = () => pg.close();
  console.log("Base: local (.data/pglite)");
}

const [{ existe }] = await query("select to_regclass('public.informes') is not null as existe", []);
if (!existe) {
  console.error("La base todavía no tiene la tabla de informes: abrí la aplicación una vez para que se cree y volvé a correr el script.");
  await cerrar();
  process.exit(1);
}

// ---- Alta ----
// "actualizado" se guarda en UTC: el mediodía de Argentina de esa fecha son las 15:00 UTC.
let creados = 0;
for (const i of informes) {
  const [ya] = await query("select 1 from informes where titulo = $1 and categoria = $2", [i.titulo, i.categoria]);
  if (ya) {
    console.log(`  = ${i.titulo} (ya existe)`);
    continue;
  }
  await query(
    `insert into informes (titulo, categoria, contenido, actualizado)
     values ($1, $2, $3, coalesce($4::date + time '15:00', now() at time zone 'UTC'))`,
    [i.titulo, i.categoria, i.contenido, i.fecha],
  );
  creados++;
  console.log(`  + ${i.titulo}`);
}
await cerrar();

console.log(`\n${creados} informe(s) importados, ${informes.length - creados} ya existían.`);
