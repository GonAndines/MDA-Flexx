import Link from "next/link";
import { Ivr } from "@/components/Ivr";
import { sincronizarAgentes } from "@/lib/agentes";
import { requireUsuario } from "@/lib/auth";
import { AHORA_AR, query } from "@/lib/db";
import { rangoCalendario } from "@/lib/calendario";
import { colorDe } from "@/lib/colores";
import { ahoraArgentina, mesActual, mesValido, moverMes, nombreMes } from "@/lib/format";
import { Claves, type Clave } from "./Claves";
import { Contactos, type Contacto } from "./Contactos";
import { Calendario, ListaNovedades, NuevaNovedad, type Novedad, type Persona } from "./Novedades";
import { Sabados, type Agente, type Sabado } from "./Sabados";

export const metadata = { title: "Resumen · Mesa de ayuda" };

export default async function ResumenPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const mes = mesValido(Array.isArray(sp.mes) ? sp.mes[0] : sp.mes);

  const usuario = await requireUsuario();
  const esAdmin = usuario.rol === "admin";
  const hoySql = `(${AHORA_AR})::date`;
  const hoy = ahoraArgentina().slice(0, 10);
  const calendario = rangoCalendario(mes);
  await sincronizarAgentes();

  const [filasNovedades, informes, contactos, sabados, agentes, usuarios, claves, personas] = await Promise.all([
    // Las que se ven en el calendario del mes (incluye los días de los meses vecinos que completan las semanas).
    query<Omit<Novedad, "color"> & { color_persona: string | null }>(
      `select n.id, n.titulo, n.texto, to_char(n.desde, 'YYYY-MM-DD') as desde, to_char(n.hasta, 'YYYY-MM-DD') as hasta,
              n.persona_id, p.nombre as persona, p.color as color_persona
       from novedades n left join usuarios p on p.id = n.persona_id
       where n.desde <= $2::date and n.hasta >= $1::date
       order by n.desde, n.hasta desc, n.id`,
      [calendario.desde, calendario.hasta],
    ),
    query<{ id: number; titulo: string; categoria: string; actualizado: string }>(
      `select id, titulo, categoria, to_char(actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
       from informes order by informes.actualizado desc limit 6`,
    ),
    query<Contacto>("select id, area, tipo, valor, detalle from contactos order by area, id"),
    query<Sabado>(
      `select s.id, to_char(s.fecha, 'YYYY-MM-DD') as fecha, s.tanda, s.feriado, s.activa_id, s.pasiva_id,
              a.nombre as activa, p.nombre as pasiva, s.fecha > ${hoySql} as futuro, s.fecha >= ${hoySql} as vigente
       from sabados s left join agentes a on a.id = s.activa_id left join agentes p on p.id = s.pasiva_id
       order by s.fecha`,
    ),
    query<Agente>(
      `select ag.id, ag.nombre, ag.usuario_id, u.nombre as usuario, ag.activo and coalesce(u.activo, true) as activo
       from agentes ag left join usuarios u on u.id = ag.usuario_id
       order by ag.activo and coalesce(u.activo, true) desc, ag.nombre`,
    ),
    esAdmin ? query<{ id: number; nombre: string }>("select id, nombre from usuarios where activo order by nombre") : [],
    query<Clave>("select id, nombre, valor from claves order by orden, id"),
    esAdmin ? query<Persona>("select id, nombre from usuarios where activo order by nombre") : [],
  ]);
  const novedades: Novedad[] = filasNovedades.map(({ color_persona, ...n }) => ({ ...n, color: colorDe(n.persona_id, color_persona) }));
  const novedadesDelMes = novedades.filter((n) => n.desde.slice(0, 7) <= mes && n.hasta.slice(0, 7) >= mes);
  const miAgenteId = agentes.find((a) => a.usuario_id === usuario.id && a.activo)?.id ?? null;

  // Columna principal con lo que se consulta; a la derecha, fijo al scrollear, lo que se copia (contraseñas y contactos).
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-8">
        <h1 className="titulo-pagina">Resumen</h1>
        <Ivr />
        <Sabados sabados={sabados} agentes={agentes} usuarios={usuarios} miAgenteId={miAgenteId} esAdmin={esAdmin} />

        <section id="novedades" className="scroll-mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="titulo">
                Novedades de <span className="capitalize">{nombreMes(mes)}</span>
              </h2>
              <Link href={`/?mes=${moverMes(mes, -1)}#novedades`} className="btn ml-2 px-2" aria-label="Mes anterior">
                ‹
              </Link>
              <Link href={`/?mes=${moverMes(mes, 1)}#novedades`} className="btn px-2" aria-label="Mes siguiente">
                ›
              </Link>
              {mes !== mesActual() && (
                <Link href="/#novedades" className="btn-link">
                  Mes actual
                </Link>
              )}
            </div>
            {esAdmin && <NuevaNovedad personas={personas} hoy={hoy} />}
          </div>
          <Calendario mes={mes} novedades={novedades} hoy={hoy} />
          <ListaNovedades novedades={novedadesDelMes} personas={personas} esAdmin={esAdmin} hoy={hoy} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="titulo">Informes recientes</h2>
            <Link href="/informes" className="btn-link">
              Ver todos
            </Link>
          </div>
          <ul className="card divide-y divide-slate-200">
            {informes.map((i) => (
              <li key={i.id}>
                <Link href={`/informes/${i.id}`} className="flex items-baseline justify-between gap-3 px-4 py-2.5 hover:bg-slate-50">
                  <span className="min-w-0 font-bold text-slate-800">{i.titulo}</span>
                  <span className="shrink-0 text-[13px] text-slate-500 tabular-nums">
                    {i.categoria}, {i.actualizado}
                  </span>
                </Link>
              </li>
            ))}
            {informes.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Todavía no hay informes.</li>}
          </ul>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto">
        <Claves claves={claves} esAdmin={esAdmin} />
        <Contactos contactos={contactos} />
      </aside>
    </div>
  );
}
