import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { BotonTema } from "@/components/Tema";
import { requireUsuario } from "@/lib/auth";
import { leerTema } from "@/lib/tema";
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

  // Barra lateral fija en pantallas anchas; en el celular queda arriba, con las pestañas en una tira.
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b border-slate-200 bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:px-5 lg:pt-6 lg:pb-5">
          <Link href="/" className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-2">
            <Logo ancho={84} className="lg:hidden" />
            <Logo ancho={130} className="hidden lg:block" />
            <span className="hidden text-base leading-tight font-bold whitespace-nowrap text-slate-700 sm:inline">Mesa de ayuda</span>
          </Link>
          <div className="flex items-center text-sm whitespace-nowrap lg:hidden">
            <BotonTema inicial={await leerTema()} />
            <Link href="/cuenta" className="btn-link">
              Mi cuenta
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-link">
                Salir
              </button>
            </form>
          </div>
        </div>
        <Nav tabs={tabs} />
        <div className="mt-auto hidden space-y-1 border-t border-slate-200 px-3 py-4 text-sm lg:block">
          <div className="truncate px-2 pb-1 font-bold text-slate-700">{usuario.nombre}</div>
          <Link href="/cuenta" className="block rounded-md px-2 py-1 text-slate-600 hover:bg-slate-50 hover:text-slate-900" title="Cambiar mi contraseña">
            Mi cuenta
          </Link>
          <BotonTema
            inicial={await leerTema()}
            className="block w-full rounded-md px-2 py-1 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          />
          <form action={logout}>
            <button type="submit" className="w-full rounded-md px-2 py-1 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className="w-full max-w-[90rem] min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
