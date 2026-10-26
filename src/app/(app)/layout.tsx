import Link from "next/link";
import { Nav } from "@/components/Nav";
import { requireUsuario } from "@/lib/auth";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const usuario = await requireUsuario();
  const tabs = [
    { href: "/", label: "Resumen" },
    { href: "/soporte-basico", label: "Soporte Básico" },
    { href: "/respuestas", label: "Respuestas rápidas" },
    { href: "/cotizador", label: "Cotizador" },
    { href: "/informes", label: "Informes" },
    ...(usuario.rol === "admin" ? [{ href: "/usuarios", label: "Usuarios" }] : []),
  ];

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="font-semibold text-slate-800">Mesa de ayuda</span>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Link href="/cuenta" className="hover:text-slate-800 hover:underline" title="Mi cuenta: cambiar contraseña">
                <span className="hidden sm:inline">{usuario.nombre} · </span>Mi cuenta
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-link">
                  Salir
                </button>
              </form>
            </div>
          </div>
          <Nav tabs={tabs} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
