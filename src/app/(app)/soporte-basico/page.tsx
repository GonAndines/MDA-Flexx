import Link from "next/link";
import { AHORA_AR, query } from "@/lib/db";
import { LIMITE_CASOS_MES, mesActual, mesValido, moverMes, nombreMes } from "@/lib/format";
import { Casos, Empresas, NuevoCaso, type Caso, type EmpresaBasico } from "./SoporteBasico";

export const metadata = { title: "Soporte Básico · Mesa de ayuda" };

export default async function SoporteBasicoPage({ searchParams }: PageProps<"/soporte-basico">) {
  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const mes = mesValido(uno(sp.mes));
  const empresaFiltro = uno(sp.empresa);

  const params: unknown[] = [`${mes}-01`];
  let filtroEmpresa = "";
  if (empresaFiltro) {
    params.push(Number(empresaFiltro));
    filtroEmpresa = `and c.empresa_id = $${params.length}`;
  }

  const [empresas, casos] = await Promise.all([
    query<EmpresaBasico>(
      `select e.id, e.nombre, e.notas, e.activa,
              (select count(*)::int from casos c where c.empresa_id = e.id and c.fecha >= date_trunc('month', ${AHORA_AR})) as casos_mes,
              (select count(*)::int from casos c where c.empresa_id = e.id) as casos_total,
              (select c.ticket::text from casos c where c.empresa_id = e.id order by c.fecha desc, c.id desc limit 1) as ultimo_ticket
       from empresas_basico e order by e.activa desc, e.nombre`,
    ),
    // `numero` = orden del caso dentro del mes para esa empresa (más de 5 = excedido).
    query<Caso>(
      `select c.id, c.empresa_id, c.empresa, c.ticket, c.fecha, c.notas, c.usuario, c.numero from (
         select c.id, c.empresa_id, e.nombre as empresa, c.ticket::text as ticket, c.fecha as fecha_ts,
                to_char(c.fecha, 'YYYY-MM-DD"T"HH24:MI') as fecha, c.notas, u.nombre as usuario,
                (row_number() over (partition by c.empresa_id, date_trunc('month', c.fecha) order by c.fecha, c.id))::int as numero
         from casos c join empresas_basico e on e.id = c.empresa_id left join usuarios u on u.id = c.usuario_id
       ) c
       where date_trunc('month', c.fecha_ts) = $1::timestamp ${filtroEmpresa}
       order by c.fecha_ts desc, c.id desc`,
      params,
    ),
  ]);

  const qs = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ mes, empresa: empresaFiltro, ...cambios });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/soporte-basico?${p}`;
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Soporte Básico</h1>
            <p className="text-sm text-slate-500">
              Cada empresa tiene {LIMITE_CASOS_MES} casos incluidos por mes calendario.
            </p>
          </div>
          <NuevoCaso empresas={empresas} />
        </div>
        <Empresas empresas={empresas} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href={qs({ mes: moverMes(mes, -1) })} className="btn" aria-label="Mes anterior">
              ‹
            </Link>
            <h2 className="min-w-44 text-center text-lg font-semibold">
              Casos de <span className="capitalize">{nombreMes(mes)}</span>
            </h2>
            <Link href={qs({ mes: moverMes(mes, 1) })} className="btn" aria-label="Mes siguiente">
              ›
            </Link>
            {mes !== mesActual() && (
              <Link href={qs({ mes: mesActual() })} className="btn-link">
                Mes actual
              </Link>
            )}
          </div>
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="mes" value={mes} />
            <select name="empresa" defaultValue={empresaFiltro} className="input w-72">
              <option value="">Todas las empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <button type="submit" className="btn">
              Filtrar
            </button>
          </form>
        </div>
        <Casos casos={casos} empresas={empresas} />
      </section>
    </div>
  );
}
