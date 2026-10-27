import Link from "next/link";
import { Ivr } from "@/components/Ivr";
import { sincronizarAgentes } from "@/lib/agentes";
import { requireUsuario } from "@/lib/auth";
import { AHORA_AR, query } from "@/lib/db";
import { mesActual, mesValido, moverMes, nombreMes } from "@/lib/format";
import { Contactos, type Contacto } from "./Contactos";
import { ListaNovedades, NuevaNovedad, type Novedad } from "./Novedades";
import { Sabados, type Agente, type Sabado } from "./Sabados";

export const metadata = { title: "Resumen · Mesa de ayuda" };

export default async function ResumenPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const mes = mesValido(Array.isArray(sp.mes) ? sp.mes[0] : sp.mes);

  const usuario = await requireUsuario();
  const esAdmin = usuario.rol === "admin";
  const hoy = `(${AHORA_AR})::date`;
  await sincronizarAgentes();

  const [novedades, informes, contactos, sabados, agentes, usuarios] = await Promise.all([
    query<Novedad>(
      `select n.id, to_char(n.mes, 'YYYY-MM') as mes, n.titulo, n.texto, u.nombre as autor,
              to_char(n.creado - interval '3 hours', 'DD/MM/YYYY') as creado
       from novedades n left join usuarios u on u.id = n.usuario_id
       where n.mes = $1::date order by n.creado desc`,
      [`${mes}-01`],
    ),
    query<{ id: number; titulo: string; categoria: string; actualizado: string }>(
      `select id, titulo, categoria, to_char(actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
       from informes order by informes.actualizado desc limit 6`,
    ),
    query<Contacto>("select id, area, tipo, valor, detalle from contactos order by area, id"),
    query<Sabado>(
      `select s.id, to_char(s.fecha, 'YYYY-MM-DD') as fecha, s.tanda, s.feriado, s.activa_id, s.pasiva_id,
              a.nombre as activa, p.nombre as pasiva, s.fecha > ${hoy} as futuro, s.fecha >= ${hoy} as vigente
       from sabados s left join agentes a on a.id = s.activa_id left join agentes p on p.id = s.pasiva_id
       order by s.fecha`,
    ),
    query<Agente>(
      `select ag.id, ag.nombre, ag.usuario_id, u.nombre as usuario, ag.activo and coalesce(u.activo, true) as activo
       from agentes ag left join usuarios u on u.id = ag.usuario_id
       order by ag.activo and coalesce(u.activo, true) desc, ag.nombre`,
    ),
    esAdmin ? query<{ id: number; nombre: string }>("select id, nombre from usuarios where activo order by nombre") : [],
  ]);
  const miAgenteId = agentes.find((a) => a.usuario_id === usuario.id && a.activo)?.id ?? null;

  return (
    <div className="space-y-6">
      <Ivr />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-4">
          <Sabados sabados={sabados} agentes={agentes} usuarios={usuarios} miAgenteId={miAgenteId} esAdmin={esAdmin} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link href={`/?mes=${moverMes(mes, -1)}`} className="btn" aria-label="Mes anterior">
                ‹
              </Link>
              <h1 className="min-w-56 text-center text-xl font-semibold">
                Novedades de <span className="capitalize">{nombreMes(mes)}</span>
              </h1>
              <Link href={`/?mes=${moverMes(mes, 1)}`} className="btn" aria-label="Mes siguiente">
                ›
              </Link>
              {mes !== mesActual() && (
                <Link href="/" className="btn-link">
                  Mes actual
                </Link>
              )}
            </div>
            <NuevaNovedad mes={mes} />
          </div>
          <ListaNovedades novedades={novedades} mes={mes} />
        </section>

        <aside className="space-y-6">
          <Contactos contactos={contactos} />
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Informes recientes</h2>
              <Link href="/informes" className="btn-link">
                Ver todos
              </Link>
            </div>
            <ul className="space-y-3">
              {informes.map((i) => (
                <li key={i.id}>
                  <Link href={`/informes/${i.id}`} className="font-medium text-blue-700 hover:underline">
                    {i.titulo}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {i.categoria} · {i.actualizado}
                  </div>
                </li>
              ))}
              {informes.length === 0 && <li className="text-sm text-slate-500">Todavía no hay informes.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
