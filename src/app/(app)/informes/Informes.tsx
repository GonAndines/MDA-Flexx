import Link from "next/link";
import { Field, FormDialog } from "@/components/FormDialog";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { urlCategoria } from "@/lib/informes";
import { crearInforme } from "./actions";

export type Informe = { id: number; titulo: string; categoria: string; contenido: string; autor: string | null; actualizado: string };
export type ResumenCategoria = { categoria: string; cantidad: number; actualizado: string };

/** Resumen en texto plano de un contenido con formato, para el listado. */
function extracto(md: string) {
  const plano = md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plano.length > 180 ? plano.slice(0, 180) + "…" : plano;
}

export function CamposInforme({ i, categorias, categoria }: { i?: Informe; categorias: string[]; categoria?: string }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_14rem] gap-3">
        <Field label="Título">
          <input name="titulo" defaultValue={i?.titulo} required className="input" />
        </Field>
        <Field label="Categoría">
          <input name="categoria" defaultValue={i?.categoria ?? categoria ?? ""} list="categorias-informes" className="input" />
          <datalist id="categorias-informes">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Contenido">
        <MarkdownEditor name="contenido" defaultValue={i?.contenido} rows={16} />
      </Field>
    </>
  );
}

function NuevoInforme({ categorias, categoria }: { categorias: string[]; categoria?: string }) {
  return (
    <FormDialog trigger="+ Nuevo informe" triggerClassName="btn-primary" title="Nuevo informe" action={crearInforme} wide>
      <CamposInforme categorias={categorias} categoria={categoria} />
    </FormDialog>
  );
}

/** Búsqueda por título y contenido; dentro de una categoría busca solo en ella. */
function Buscador({ q, categoria }: { q: string; categoria: string }) {
  return (
    <form action="/informes" className="flex max-w-md flex-1 gap-2">
      {categoria && <input type="hidden" name="categoria" value={categoria} />}
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder={categoria ? `Buscar en ${categoria}…` : "Buscar en todos los informes…"}
        className="input"
      />
      <button type="submit" className="btn">
        Buscar
      </button>
    </form>
  );
}

/**
 * Pantalla de informes en dos columnas: las categorías a la izquierda y, a la derecha, los informes de la elegida
 * (o los resultados de la búsqueda, si no hay categoría). En el celular las categorías quedan en una tira arriba.
 */
export function Informes({
  resumen,
  informes,
  categoria,
  q,
  categorias,
}: {
  resumen: ResumenCategoria[];
  informes: Informe[];
  categoria: string;
  q: string;
  categorias: string[];
}) {
  const total = resumen.reduce((s, r) => s + r.cantidad, 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-pagina">Informes</h1>
          <p className="text-sm text-slate-500">Notas de release, uso del sistema, procedimientos y otra información relevante.</p>
        </div>
        <NuevoInforme categorias={categorias} categoria={categoria || undefined} />
      </div>

      {resumen.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay informes.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Categorías" className="card overflow-x-auto p-1.5 lg:sticky lg:top-6">
            <ul className="flex gap-1 lg:flex-col">
              {resumen.map((r) => {
                const activa = r.categoria === categoria;
                return (
                  <li key={r.categoria}>
                    <Link
                      href={urlCategoria(r.categoria)}
                      aria-current={activa ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                        activa ? "bg-blue-600 font-bold text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {r.categoria}
                      <span className={`tabular-nums ${activa ? "text-blue-100" : "text-slate-400"}`}>{r.cantidad}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="hidden border-t border-slate-200 px-3 pt-2 pb-1 text-xs text-slate-400 lg:mt-1.5 lg:block">{total} informes en total</p>
          </nav>

          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="titulo">{categoria || "Resultados de la búsqueda"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {informes.length === 1 ? "1 informe" : `${informes.length} informes`}
                  {q && ` que ${informes.length === 1 ? "coincide" : "coinciden"} con "${q}"`}
                  {q && (
                    <>
                      {" · "}
                      <Link href={categoria ? urlCategoria(categoria) : "/informes"} className="text-blue-700 hover:underline">
                        Limpiar búsqueda
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <Buscador q={q} categoria={categoria} />
            </div>

            {informes.length === 0 ? (
              <p className="text-sm text-slate-500">No hay informes que coincidan.</p>
            ) : (
              <ul className="card divide-y divide-slate-200">
                {informes.map((i) => (
                  <li key={i.id}>
                    <Link href={`/informes/${i.id}`} className="block px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-slate-900">{i.titulo}</h3>
                        <span className="shrink-0 text-xs text-slate-400 tabular-nums">{i.actualizado}</span>
                      </div>
                      {!categoria && (
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{i.categoria}</span>
                      )}
                      <p className="mt-1 text-sm text-slate-600">{extracto(i.contenido)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
