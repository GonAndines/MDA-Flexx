import Link from "next/link";
import { Field, FormDialog } from "@/components/FormDialog";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { ahoraArgentina } from "@/lib/format";
import { DIAS, INDICADORES, MESES, esIndicador, type Indicador } from "@/lib/indicadores";
import { guardarMes, importarRings } from "./actions";
import { GraficoBarras } from "./Graficos";

export const metadata = { title: "Indicadores · Mesa de ayuda" };

type Valor = { indicador: Indicador; mes: number; dia_semana: number; valor: number };

const numero = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-AR"));
const porcentaje = (parte: number, total: number) => (total ? `${((parte / total) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %` : "");
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function IndicadoresPage({ searchParams }: PageProps<"/indicadores">) {
  await requireAdmin();
  const sp = await searchParams;
  const anioActual = Number(ahoraArgentina().slice(0, 4));
  const anio = Number(uno(sp.anio)) || anioActual;
  const mesFiltro = Number(uno(sp.mes)) || 0; // 0 = todo el año (gráfico por día de la semana)
  const ind: Indicador = esIndicador(uno(sp.ind)) ? (uno(sp.ind) as Indicador) : "rings_perdidos";
  const url = (cambios: Record<string, string | number>) => {
    const p = new URLSearchParams({ anio: String(anio), mes: String(mesFiltro), ind, ...Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, String(v)])) });
    return `/indicadores?${p}`;
  };

  const [valores, anios] = await Promise.all([
    query<Valor>("select indicador, mes, dia_semana, valor from indicadores where anio = $1", [anio]),
    query<{ anio: number }>("select distinct anio from indicadores order by anio"),
  ]);

  // Totales por indicador y mes (null = sin datos), y rings perdidos por mes y día de la semana.
  const total = (i: Indicador, mes: number) => {
    const v = valores.filter((x) => x.indicador === i && x.mes === mes);
    return v.length ? v.reduce((s, x) => s + x.valor, 0) : null;
  };
  const meses = MESES.map((nombre, i) => ({
    nombre,
    mes: i + 1,
    totales: Object.fromEntries((Object.keys(INDICADORES) as Indicador[]).map((k) => [k, total(k, i + 1)])) as Record<Indicador, number | null>,
    rings: DIAS.map((_, d) => valores.find((x) => x.indicador === "rings_perdidos" && x.mes === i + 1 && x.dia_semana === d + 1)?.valor ?? null),
  }));
  const anual = (i: Indicador) => {
    const v = meses.map((m) => m.totales[i]).filter((n): n is number => n !== null);
    return { total: v.length ? v.reduce((a, b) => a + b, 0) : null, meses: v.length };
  };

  // Rings perdidos por día de la semana: del mes elegido o sumando el año. El domingo solo aparece si tiene datos.
  const ringsDia = DIAS.map((_, d) =>
    (mesFiltro ? meses.filter((m) => m.mes === mesFiltro) : meses).reduce<number | null>((s, m) => (m.rings[d] === null ? s : (s ?? 0) + m.rings[d]!), null),
  );
  const totalDia = ringsDia.reduce<number>((s, n) => s + (n ?? 0), 0);
  const diasVisibles = DIAS.map((nombre, d) => ({ nombre, valor: ringsDia[d] })).filter((x, d) => d < 6 || (x.valor ?? 0) > 0);
  // Día (o días, si empatan) con más rings perdidos.
  const maxDia = Math.max(...diasVisibles.map((d) => d.valor ?? 0));
  const peores = totalDia ? diasVisibles.filter((d) => d.valor === maxDia).map((d) => d.nombre.toLowerCase()) : [];
  const enumerar = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}` : (xs[0] ?? ""));
  const mesesConRings = meses.filter((m) => m.totales.rings_perdidos !== null);

  const aniosNav = [...new Set([...anios.map((a) => a.anio), anioActual, anio])].sort();
  const iAnio = aniosNav.indexOf(anio);

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="titulo-pagina">Indicadores {anio}</h1>
          {iAnio > 0 && (
            <Link href={url({ anio: aniosNav[iAnio - 1], mes: 0 })} className="btn ml-2 px-2" aria-label="Año anterior">
              ‹
            </Link>
          )}
          {iAnio < aniosNav.length - 1 && (
            <Link href={url({ anio: aniosNav[iAnio + 1], mes: 0 })} className="btn px-2" aria-label="Año siguiente">
              ›
            </Link>
          )}
        </div>
        <FormDialog trigger="Importar Excel de rings" triggerClassName="btn-primary" title="Importar rings perdidos" action={importarRings} submitLabel="Importar">
          <p className="text-sm text-slate-600">
            La planilla tiene un cuadro por mes (el nombre del mes arriba, y debajo cada día de la semana con su cantidad de rings perdidos). Los
            meses que traen datos reemplazan a los que ya estaban cargados; los que vienen todos en cero se ignoran.
          </p>
          <Field label="Año de la planilla">
            <input name="anio" type="number" min="2000" max="2100" defaultValue={anio} required className="input w-32" />
          </Field>
          <Field label="Archivo (.xlsx)">
            <input name="archivo" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="input" />
          </Field>
        </FormDialog>
      </div>

      {/* Totales del año */}
      <section className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(INDICADORES) as Indicador[]).map((k) => {
          const a = anual(k);
          return (
            <div key={k} className="card p-4">
              <div className="text-sm text-slate-600">{INDICADORES[k]} en {anio}</div>
              <div className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{numero(a.total)}</div>
              <div className="mt-1 text-[13px] text-slate-500">
                {a.meses
                  ? `Promedio ${numero(Math.round(a.total! / a.meses))} por mes, ${a.meses} ${a.meses === 1 ? "mes cargado" : "meses cargados"}`
                  : "Sin datos cargados"}
              </div>
            </div>
          );
        })}
      </section>

      {/* Rings perdidos por día de la semana */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="titulo">Rings perdidos por día de la semana</h2>
          {peores.length > 0 && (
            <p className="text-sm text-slate-600">
              Más rings perdidos: <strong className="text-slate-900">{enumerar(peores)}</strong> ({porcentaje(maxDia, totalDia)}
              {mesFiltro ? ` de ${MESES[mesFiltro - 1].toLowerCase()}` : " del año"}
              {peores.length > 1 ? " cada uno" : ""})
            </p>
          )}
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Período del gráfico">
          {[{ mes: 0, nombre: `Todo ${anio}` }, ...mesesConRings.map((m) => ({ mes: m.mes, nombre: m.nombre }))].map((p) => (
            <Link
              key={p.mes}
              href={url({ mes: p.mes })}
              aria-current={p.mes === mesFiltro ? "true" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${p.mes === mesFiltro ? "bg-blue-600 font-bold text-white" : "bg-surface text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {p.nombre}
            </Link>
          ))}
        </nav>
        <div className="card p-4">
          <GraficoBarras
            barras={diasVisibles.map((d) => ({ etiqueta: d.nombre, valor: d.valor, detalle: d.valor ? porcentaje(d.valor, totalDia) : undefined }))}
            vacio="No hay rings perdidos cargados para este período. Importá la planilla con el botón de arriba."
          />
        </div>
      </section>

      {/* Totales por mes */}
      <section className="space-y-3">
        <h2 className="titulo">Totales por mes</h2>
        <nav className="flex flex-wrap gap-1.5" aria-label="Indicador del gráfico">
          {(Object.keys(INDICADORES) as Indicador[]).map((k) => (
            <Link
              key={k}
              href={url({ ind: k })}
              aria-current={k === ind ? "true" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${k === ind ? "bg-blue-600 font-bold text-white" : "bg-surface text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {INDICADORES[k]}
            </Link>
          ))}
        </nav>
        <div className="card p-4">
          <GraficoBarras
            barras={meses.map((m) => ({ etiqueta: m.nombre.slice(0, 3), valor: m.totales[ind] }))}
            vacio={`No hay ${INDICADORES[ind].toLowerCase()} cargados en ${anio}. Cargalos con Editar en la tabla de abajo.`}
          />
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mes</th>
                {(Object.keys(INDICADORES) as Indicador[]).map((k) => (
                  <th key={k} className="text-right">
                    {INDICADORES[k]}
                  </th>
                ))}
                <th>Día con más rings</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => {
                const maxMes = Math.max(...m.rings.map((n) => n ?? 0));
                return (
                  <tr key={m.mes}>
                    <td className="font-bold">{m.nombre}</td>
                    {(Object.keys(INDICADORES) as Indicador[]).map((k) => (
                      <td key={k} className={`text-right tabular-nums ${m.totales[k] === null ? "text-slate-400" : ""}`}>
                        {numero(m.totales[k])}
                      </td>
                    ))}
                    <td className="text-slate-600">
                      {maxMes > 0 ? enumerar(DIAS.filter((_, i) => m.rings[i] === maxMes).map((d) => d.toLowerCase())) : "—"}
                    </td>
                    <td className="text-right">
                      <FormDialog trigger="Editar" triggerClassName="btn-link" title={`${m.nombre} ${anio}`} action={guardarMes.bind(null, anio, m.mes)}>
                        <p className="text-sm text-slate-600">Dejá vacío lo que no tengas; vacío no es lo mismo que cero.</p>
                        <fieldset className="grid grid-cols-3 gap-3">
                          <legend className="label mb-2">Rings perdidos por día</legend>
                          {DIAS.map((d, i) => (
                            <Field key={d} label={d}>
                              <input name={`dia${i + 1}`} type="number" min="0" step="1" defaultValue={m.rings[i] ?? ""} className="input" />
                            </Field>
                          ))}
                        </fieldset>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Llamadas atendidas">
                            <input name="llamadas_atendidas" type="number" min="0" step="1" defaultValue={m.totales.llamadas_atendidas ?? ""} className="input" />
                          </Field>
                          <Field label="Tickets resueltos">
                            <input name="tickets_resueltos" type="number" min="0" step="1" defaultValue={m.totales.tickets_resueltos ?? ""} className="input" />
                          </Field>
                        </div>
                      </FormDialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="px-3 py-2">Total {anio}</td>
                {(Object.keys(INDICADORES) as Indicador[]).map((k) => (
                  <td key={k} className="px-3 py-2 text-right tabular-nums">
                    {numero(anual(k).total)}
                  </td>
                ))}
                <td className="px-3 py-2 font-normal text-slate-600">{!mesFiltro && peores.length ? enumerar(peores) : ""}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
