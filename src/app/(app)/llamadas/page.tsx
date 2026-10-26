import Link from "next/link";
import { AHORA_AR, query } from "@/lib/db";
import { ESTADOS } from "@/lib/format";
import { NuevaLlamada, TablaLlamadas, type EmpresaOpcion, type Llamada } from "./Llamadas";

export const metadata = { title: "Llamadas · Mesa de ayuda" };

const PERIODOS = {
  hoy: { label: "Hoy", desde: `date_trunc('day', ${AHORA_AR})` },
  "7d": { label: "Últimos 7 días", desde: `date_trunc('day', ${AHORA_AR}) - interval '6 days'` },
  mes: { label: "Mes actual", desde: `date_trunc('month', ${AHORA_AR})` },
  "30d": { label: "Últimos 30 días", desde: `date_trunc('day', ${AHORA_AR}) - interval '29 days'` },
  todo: { label: "Todo", desde: null },
} as const;

type Periodo = keyof typeof PERIODOS;

export default async function LlamadasPage({ searchParams }: PageProps<"/llamadas">) {
  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const empresa = uno(sp.empresa);
  const estado = uno(sp.estado);
  const periodo: Periodo = uno(sp.periodo) in PERIODOS ? (uno(sp.periodo) as Periodo) : "30d";

  const where: string[] = [];
  const params: unknown[] = [];
  if (empresa) {
    params.push(Number(empresa));
    where.push(`l.empresa_id = $${params.length}`);
  }
  if (estado === "abiertas") {
    where.push("l.estado <> 'resuelta'");
  } else if (estado in ESTADOS) {
    params.push(estado);
    where.push(`l.estado = $${params.length}`);
  }
  if (PERIODOS[periodo].desde) where.push(`l.fecha >= ${PERIODOS[periodo].desde}`);
  const filtro = where.length ? `where ${where.join(" and ")}` : "";

  const [llamadas, porEmpresa, empresas] = await Promise.all([
    query<Llamada>(
      `select l.id, l.empresa_id, e.nombre as empresa, l.contacto, to_char(l.fecha, 'YYYY-MM-DD"T"HH24:MI') as fecha,
              l.motivo, l.estado, l.resolucion, u.nombre as usuario
       from llamadas l join empresas e on e.id = l.empresa_id left join usuarios u on u.id = l.usuario_id
       ${filtro} order by l.fecha desc limit 500`,
      params,
    ),
    query<{ empresa_id: number; empresa: string; total: number; abiertas: number }>(
      `select l.empresa_id, e.nombre as empresa, count(*)::int as total,
              count(*) filter (where l.estado <> 'resuelta')::int as abiertas
       from llamadas l join empresas e on e.id = l.empresa_id
       ${filtro} group by l.empresa_id, e.nombre order by total desc, e.nombre`,
      params,
    ),
    query<EmpresaOpcion>(
      `select e.id, e.nombre, e.contacto, e.activa, p.nombre as plan, p.llamadas_mes as limite,
              (select count(*)::int from llamadas l where l.empresa_id = e.id and l.fecha >= date_trunc('month', ${AHORA_AR})) as usadas
       from empresas e left join planes p on p.id = e.plan_id order by e.nombre`,
    ),
  ]);

  const total = porEmpresa.reduce((s, r) => s + r.total, 0);
  const qs = (cambios: Record<string, string>) =>
    "/llamadas?" + new URLSearchParams({ empresa, estado, periodo, ...cambios }).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Llamadas</h1>
        <NuevaLlamada empresas={empresas} />
      </div>

      <form method="get" className="card flex flex-wrap items-end gap-3 p-3">
        <label>
          <span className="label">Empresa</span>
          <select name="empresa" defaultValue={empresa} className="input min-w-[14rem]">
            <option value="">Todas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Estado</span>
          <select name="estado" defaultValue={estado} className="input">
            <option value="">Todos</option>
            <option value="abiertas">Abiertas (pendiente o en curso)</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Período</span>
          <select name="periodo" defaultValue={periodo} className="input">
            {Object.entries(PERIODOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
        <Link href="/llamadas" className="btn-link">
          Limpiar
        </Link>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <TablaLlamadas llamadas={llamadas} empresas={empresas} />

        <aside className="card h-fit p-4">
          <h2 className="mb-2 font-semibold">Llamadas por empresa</h2>
          <p className="mb-3 text-xs text-slate-500">
            {total} llamada{total === 1 ? "" : "s"} con los filtros actuales.
          </p>
          <ul className="space-y-1 text-sm">
            {porEmpresa.map((r) => (
              <li key={r.empresa_id} className="flex items-center justify-between gap-2">
                <Link href={qs({ empresa: String(r.empresa_id) })} className="truncate text-blue-700 hover:underline">
                  {r.empresa}
                </Link>
                <span className="shrink-0 tabular-nums">
                  {r.total}
                  {r.abiertas > 0 && <span className="ml-1 text-xs text-amber-700">({r.abiertas} abiertas)</span>}
                </span>
              </li>
            ))}
            {porEmpresa.length === 0 && <li className="text-slate-500">Sin llamadas.</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
