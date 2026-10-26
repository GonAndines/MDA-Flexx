"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cerrarSesion, iniciarSesion } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { texto } from "@/lib/format";

export type LoginState = { error: string; email: string } | null;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = texto(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña.", email };

  const hay = await queryOne<{ n: number }>("select count(*)::int as n from usuarios");
  if (!hay?.n) {
    return { error: "No hay usuarios cargados: definí ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno y reiniciá.", email };
  }

  const u = await queryOne<{ id: number; password_hash: string }>(
    "select id, password_hash from usuarios where email = $1 and activo",
    [email],
  );
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return { error: "Email o contraseña incorrectos.", email };

  await iniciarSesion(u.id);
  redirect("/");
}

export async function logout() {
  await cerrarSesion();
  redirect("/login");
}
