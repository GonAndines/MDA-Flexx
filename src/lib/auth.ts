import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { queryOne } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export type Usuario = { id: number; nombre: string; email: string; rol: "admin" | "operador" };

/** Usuario logueado y activo, o null. Se consulta una vez por request. */
export const getUsuario = cache(async (): Promise<Usuario | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const u = await queryOne<Usuario>("select id, nombre, email, rol from usuarios where id = $1 and activo", [session.uid]);
  return u ?? null;
});

/** Para páginas y acciones: exige sesión válida (cada acción del servidor la vuelve a verificar). */
export async function requireUsuario() {
  const u = await getUsuario();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUsuario();
  if (u.rol !== "admin") redirect("/");
  return u;
}

export async function iniciarSesion(uid: number) {
  (await cookies()).set(SESSION_COOKIE, await signSession({ uid }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
}
