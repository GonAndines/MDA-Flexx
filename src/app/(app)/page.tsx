import Link from "next/link";
import { AHORA_AR, query, queryOne } from "@/lib/db";
import { formatFechaHora, type Estado } from "@/lib/format";
import { EstadoBadge } from "./llamadas/Llamadas";

export const metadata = { title: "Resumen · Mesa de ayuda" };

const HOY = `date_trunc('day', ${AHORA_AR})`;
const MES = `date_trunc('month', ${AHORA_AR})`;

export default async function ResumenPage() {
  const [kpi, porEmpresa, abiertas, porPlan] = await Promise.all([
    queryOne<{ hoy: number; resueltas_hoy: number; abiertas: number; pendientes: number; mes: number }>(
      `select count(*) filter (where fecha >= ${HOY})::int as hoy,
              count(*) filter (where fecha >= ${HOY} and estado = 'resuelta')::int as resueltas_hoy,
              count(*) filter (where estado <> 'resuelta')::int as abiertas,
              count(*) filter (where estado = 'pendiente')::int as pendientes,
              count(*) filter (where fecha >= ${MES})::int as mes
       from llamadas`,
    ),
    query<{ id: number; nombre: string; plan: string | null; limite: number | null; hoy: number; mes: number; abiertas: number }>(
      `select e.id, e.nombre, p.nombre as plan, p.llamadas_mes as limite,
              count(l.id) filter (where l.fecha >= ${HOY})::int as hoy,
              count(l.id) filter (where l.fecha >= ${MES})::int as mes,
              count(l.id) filter (where l.estado <> 'resuelta')::int as abiertas
       from empresas e
       left join planes p on p.id = e.plan_id
       left join llamadas l on l.empresa_id = e.id
       where e.activa
       group by e.id, e.nombre, p.nombre, p.llamadas_mes
       order by mes desc, abiertas desc, e.nombre`,
    ),
    query<{ id: number; empresa: string; motivo: string; estado: Estado; fecha: string }>(
      `select l.id, e.nombre as empresa, l.motivo, l.estado, to_char(l.fecha, 'YYYY-MM-DD"T"HH24:MI') as fecha
       from llamadas l join empresas e on e.id = l.empresa_id
       where l.estado <> 'resuelta' order by l.fecha limit 10`,
    ),
    query<{ plan: string; empresas: number }>(
      `select coalesce(p.nombre, 'Sin asignar') as plan, count(e.id)::int as empresas
       from empresas e left join planes p on p.id = e.plan_id
       where e.activa group by p.nombre, p.orden order by p.orden nulls last`,
    ),
  ]);

  const excedidas = porEmpresa.filter((e) => e.limite !== null && e.mes > e.limite).length;
  const maxPlan = Math.max(1, ...porPlan.map((p) => p.empresas));

  const tiles = [
    { label: "Llamadas de hoy", valor: kpi?.hoy ?? 0, detalle: `${kpi?.resueltas_hoy ?? 0} resueltas`, href: "/llamadas?periodo=hoy" },
    { label: "Abiertas", valor: kpi?.abiertas ?? 0, detalle: `${kpi?.pendientes ?? 0} pendientes sin tomar`, href: "/llamadas?estado=abiertas&periodo=todo" },
    { label: "Llamadas del mes", valor: kpi?.mes ?? 0, detalle: "desde el día 1", href: "/llamadas?periodo=mes" },
    { label: "Empresas sobre el límite", valor: excedidas, detalle: "superaron las llamadas del plan", href: "/planes" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Resumen</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 hover:border-blue-300">
            <div className="text-sm text-slate-500">{t.label}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{t.valor}</div>
            <div className="mt-1 text-xs text-slate-500">{t.detalle}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className="card overflow-x-auto">
          <h2 className="px-4 pt-4 pb-2 font-semibold">Llamadas por empresa</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th className="text-right">Hoy</th>
                <th className="text-right">Mes / incluidas</th>
                <th className="text-right">Abiertas</th>
              </tr>
            </thead>
            <tbody>
              {porEmpresa.map((e) => {
                const excedida = e.limite !== null && e.mes > e.limite;
                return (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/llamadas?empresa=${e.id}&periodo=mes`} className="font-medium text-blue-700 hover:underline">
                        {e.nombre}
                      </Link>
                    </td>
                    <td className="text-slate-600">{e.plan ?? "—"}</td>
                    <td className="text-right tabular-nums">{e.hoy}</td>
                    <td className={`text-right tabular-nums ${excedida ? "font-semibold text-red-600" : ""}`}>
                      {e.mes}
                      {e.limite !== null ? ` / ${e.limite}` : ""}
                      {excedida && " ⚠"}
                    </td>
                    <td className="text-right tabular-nums">{e.abiertas || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-3 font-semibold">Abiertas más antiguas</h2>
            <ul className="space-y-3">
              {abiertas.map((l) => (
                <li key={l.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{l.empresa}</span>
                    <EstadoBadge estado={l.estado} />
                  </div>
                  <div className="truncate text-slate-600">{l.motivo}</div>
                  <div className="text-xs text-slate-400">{formatFechaHora(l.fecha)}</div>
                </li>
              ))}
              {abiertas.length === 0 && <li className="text-sm text-slate-500">No hay llamadas abiertas. 🎉</li>}
            </ul>
          </section>

          <section className="card p-4">
            <h2 className="mb-3 font-semibold">Empresas activas por plan</h2>
            <ul className="space-y-2">
              {porPlan.map((p) => (
                <li key={p.plan} className="text-sm" title={`${p.plan}: ${p.empresas} empresa(s)`}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-slate-700">{p.plan}</span>
                    <span className="tabular-nums text-slate-600">{p.empresas}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(p.empresas / maxPlan) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
