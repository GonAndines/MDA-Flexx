// Alta masiva de usuarios desde un CSV.
//
// Uso:  node scripts/crear-usuarios.mjs usuarios.csv
//
// El CSV lleva una fila por usuario con: nombre;email;rol  (también acepta comas; rol = admin u operador,
// si se deja vacío es operador). La primera fila puede ser el encabezado.
//
// Con DATABASE_URL definida escribe en esa base (Neon/Vercel). Sin ella, en la base local de desarrollo (.data/pglite).
// A cada usuario nuevo le genera una contraseña temporal y las guarda en usuarios-creados.csv (no se sube a git).
// Los emails que ya existen se saltean sin cambios.

import { randomInt } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";

const archivo = process.argv[2];
if (!archivo) {
  console.error("Uso: node scripts/crear-usuarios.mjs usuarios.csv");
  process.exit(1);
}

// ---- Leer el CSV ----
// Cada fila guarda su número de línea en el archivo; se ignoran las vacías (Excel suele agregar ";;;" al final).
const filas = readFileSync(archivo, "utf8")
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .map((l, i) => ({ linea: i + 1, celdas: l.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, "")) }))
  .filter((f) => f.celdas.some(Boolean));

if (filas.length && /email/i.test(filas[0].celdas.join(" "))) filas.shift();

const usuarios = [];
const errores = [];
for (const { linea, celdas } of filas) {
  const [nombre, email = "", rol = ""] = celdas;
  const e = email.toLowerCase();
  const r = rol.toLowerCase() || "operador";
  if (!nombre || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) errores.push(`Línea ${linea}: nombre o email inválido`);
  else if (!["admin", "operador"].includes(r)) errores.push(`Línea ${linea}: rol "${rol}" inválido (admin u operador)`);
  else if (usuarios.some((u) => u.email === e)) errores.push(`Línea ${linea}: email repetido ${e}`);
  else usuarios.push({ nombre, email: e, rol: r });
}

if (errores.length) {
  console.error("Revisá el CSV:\n  " + errores.join("\n  "));
  process.exit(1);
}
if (!usuarios.length) {
  console.error("El CSV no tiene usuarios.");
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

const [{ existe }] = await query("select to_regclass('public.usuarios') is not null as existe", []);
if (!existe) {
  console.error("La base todavía no tiene la tabla de usuarios: abrí la aplicación una vez para que se cree y volvé a correr el script.");
  await cerrar();
  process.exit(1);
}

// ---- Alta ----
// Contraseña temporal legible (sin 0/O ni 1/l/I), 12 caracteres.
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const clave = () => Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

const creados = [];
for (const u of usuarios) {
  const [ya] = await query("select 1 from usuarios where email = $1", [u.email]);
  if (ya) {
    console.log(`  = ${u.email} ya existe, no se modifica`);
    continue;
  }
  const password = clave();
  await query("insert into usuarios (nombre, email, password_hash, rol) values ($1, $2, $3, $4)", [
    u.nombre,
    u.email,
    await bcrypt.hash(password, 10),
    u.rol,
  ]);
  creados.push({ ...u, password });
  console.log(`  + ${u.email} (${u.rol})`);
}
await cerrar();

if (creados.length) {
  const salida = "usuarios-creados.csv";
  writeFileSync(
    salida,
    "﻿nombre;email;rol;contraseña temporal\n" + creados.map((u) => [u.nombre, u.email, u.rol, u.password].join(";")).join("\n") + "\n",
  );
  console.log(`\n${creados.length} usuario(s) creados. Contraseñas temporales en ${salida}: pasáselas a cada uno y después borrá el archivo.`);
} else {
  console.log("\nNo se creó ningún usuario.");
}
