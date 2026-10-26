import { connection } from "next/server";
import { ensureSchema } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface Driver {
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

/**
 * Con DATABASE_URL usa Neon (Postgres serverless, el que se conecta desde Vercel).
 * Sin DATABASE_URL usa PGlite: un Postgres embebido que guarda los datos en ./.data/pglite,
 * así el proyecto corre localmente sin instalar nada.
 */
async function createDriver(): Promise<Driver> {
  // La integración de Neon en Vercel crea DATABASE_URL y, según cómo se conecte, también POSTGRES_URL.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return { query: (text, params = []) => sql.query(text, params) as Promise<Row[]> };
  }
  if (process.env.VERCEL) {
    throw new Error("Falta la variable de entorno DATABASE_URL (conectá una base Neon al proyecto en Vercel).");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  return { query: async (text, params = []) => (await pg.query<Row>(text, params)).rows };
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

/** Hora actual de Argentina (UTC-3, sin horario de verano) como timestamp sin zona. */
export const AHORA_AR = "(now() at time zone 'UTC' - interval '3 hours')";
