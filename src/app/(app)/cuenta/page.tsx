import { requireUsuario } from "@/lib/auth";
import { CambiarClave } from "./CambiarClave";

export const metadata = { title: "Mi cuenta · Mesa de ayuda" };

export default async function CuentaPage() {
  const u = await requireUsuario();
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Mi cuenta</h1>
      <div className="card p-4 text-sm">
        <div className="font-medium text-slate-900">{u.nombre}</div>
        <div className="text-slate-500">{u.email}</div>
        <div className="text-slate-500">{u.rol === "admin" ? "Administrador" : "Operador"}</div>
      </div>
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Cambiar contraseña</h2>
        <CambiarClave />
      </section>
    </div>
  );
}
