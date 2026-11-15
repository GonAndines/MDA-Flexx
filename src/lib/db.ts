import { connection } from "next/server";
import { ensureSchema } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface Driver {
  query(text: string, params?: unknown[]): Promise<Row[]>;
  /**
   * Ejecuta varias sentencias como una sola transacción: o se aplican todas o ninguna.
   * Es "no interactiva": las sentencias se arman antes de ejecutar, así funciona igual
   * en Neon (un solo POST) y en PGlite. No sirve para leer un `returning` y usarlo en la
   * sentencia siguiente; para eso hay que usar SQL que lo resuelva solo (CTE, subconsulta).
   */
  transaction(sentencias: Sentencia[]): Promise<Row[][]>;
}

export type Sentencia = { text: string; params?: unknown[] };

/**
 * Con DATABASE_URL usa Neon (Postgres serverless, el que se conecta desde Vercel).
 * Sin DATABASE_URL usa PGlite: un Postgres embebido que guarda los datos en ./.data/pglite,
 * así el proyecto corre localmente sin instalar nada.
 */
async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return {
      query: (text, params = []) => sql.query(text, params) as Promise<Row[]>,
      transaction: (sentencias) =>
        sql.transaction((tx) => sentencias.map((s) => tx.query(s.text, s.params ?? []))) as Promise<Row[][]>,
    };
  }
  if (process.env.VERCEL) {
    throw new Error("Falta la variable de entorno DATABASE_URL (conectá una base Neon al proyecto en Vercel).");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  return {
    query: async (text, params = []) => (await pg.query<Row>(text, params)).rows,
    transaction: (sentencias) =>
      pg.transaction(async (tx) => {
        const filas: Row[][] = [];
        for (const s of sentencias) filas.push((await tx.query<Row>(s.text, s.params ?? [])).rows);
        return filas;
      }),
  };
}

// Se guarda en globalThis para que la recarga en caliente de `next dev` no abra la base dos veces.
const g = globalThis as unknown as { __mdaDb?: Promise<Driver> };

function db(): Promise<Driver> {
  g.__mdaDb ??= createDriver()
    .then(async (d) => {
      await ensureSchema(d);
      return d;
    })
    .catch((e) => {
      g.__mdaDb = undefined;
      throw e;
    });
  return g.__mdaDb;
}

export async function query<T = Row>(text: string, params?: unknown[]): Promise<T[]> {
  await connection(); // nunca consultar la base durante el build/prerender
  return (await db()).query(text, params) as Promise<T[]>;
}

export async function queryOne<T = Row>(text: string, params?: unknown[]): Promise<T | undefined> {
  return (await query<T>(text, params))[0];
}

/** Varias sentencias atómicas. Devuelve las filas de cada una, en orden. */
export async function transaction(sentencias: Sentencia[]): Promise<Row[][]> {
  if (!sentencias.length) return [];
  await connection(); // nunca consultar la base durante el build/prerender
  return (await db()).transaction(sentencias);
}

/** Hora actual de Argentina (UTC-3, sin horario de verano) como timestamp sin zona. */
export const AHORA_AR = "(now() at time zone 'UTC' - interval '3 hours')";
