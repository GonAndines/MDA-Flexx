"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pestañas: lista vertical en la barra lateral (pantallas anchas) y tira horizontal en el celular. */
export function Nav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto px-2 lg:mb-0 lg:flex-col lg:gap-0.5 lg:px-3">
      {tabs.map((t) => {
        const activa = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={activa ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm whitespace-nowrap lg:rounded-r-md lg:border-b-0 lg:border-l-[3px] lg:py-2 ${
              activa
                ? "border-blue-600 font-bold text-blue-700 lg:bg-blue-50"
                : "border-transparent text-slate-600 hover:text-slate-900 lg:hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
