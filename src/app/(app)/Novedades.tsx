"use client";

import { useEffect, useRef } from "react";
import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { Markdown } from "@/components/Markdown";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { semanasDelMes, textoRango } from "@/lib/calendario";
import { estiloColor, type Color } from "@/lib/colores";
import { borrarNovedad, crearNovedad, editarNovedad } from "./actions";

export type Novedad = {
  id: number;
  titulo: string;
  texto: string;
  desde: string;
  hasta: string;
  persona_id: number | null;
  persona: string | null;
  color: Color;
};
export type Persona = { id: number; nombre: string };

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const SUGERENCIAS = ["Vacaciones", "Carpeta médica", "Licencia", "Día de estudio", "Capacitación", "Feriado"];

function Campos({ n, personas, hoy }: { n?: Novedad; personas: Persona[]; hoy: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título">
          <input name="titulo" defaultValue={n?.titulo} required list="sugerencias-novedades" className="input" placeholder="Ej: Vacaciones" />
          <datalist id="sugerencias-novedades">
            {SUGERENCIAS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Persona">
          <select name="persona" defaultValue={n?.persona_id ?? ""} className="input">
            <option value="">Todo el equipo</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Desde">
          <input name="desde" type="date" defaultValue={n?.desde ?? hoy} required className="input" />
        </Field>
        <Field label="Hasta (vacío = un solo día)">
          <input name="hasta" type="date" defaultValue={n && n.hasta !== n.desde ? n.hasta : ""} className="input" />
        </Field>
      </div>
      <Field label="Detalle (opcional)">
        <MarkdownEditor name="texto" defaultValue={n?.texto} rows={5} />
      </Field>
    </>
  );
}

export function NuevaNovedad({ personas, hoy }: { personas: Persona[]; hoy: string }) {
  return (
    <FormDialog trigger="+ Novedad" triggerClassName="btn-primary" title="Nueva novedad" action={crearNovedad} wide>
      <Campos personas={personas} hoy={hoy} />
    </FormDialog>
  );
}

const etiqueta = (n: Novedad) => (n.persona ? `${n.persona}: ${n.titulo}` : n.titulo);

/** Calendario del mes: cada novedad es una barra del color de la persona que cruza los días que dura. */
export function Calendario({ mes, novedades, hoy }: { mes: string; novedades: Novedad[]; hoy: string }) {
  const semanas = semanasDelMes(mes);
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-600">
        {DIAS.map((d) => (
          <div key={d} className="px-2 py-1.5">
            {d}
          </div>
        ))}
      </div>
      {semanas.map((dias) => {
        const enSemana = novedades
          .filter((n) => n.desde <= dias[6] && n.hasta >= dias[0])
          .sort((a, b) => a.desde.localeCompare(b.desde) || b.hasta.localeCompare(a.hasta));
        return (
          <div key={dias[0]} className="relative border-b border-slate-200 last:border-b-0">
            {/* Fondo: un recuadro por día; los de otros meses y los fines de semana, apagados. */}
            <div className="absolute inset-0 grid grid-cols-7" aria-hidden>
              {dias.map((d, i) => (
                <div
                  key={d}
                  className={`border-r border-slate-200 last:border-r-0 ${d.slice(0, 7) !== mes ? "bg-slate-100/70" : i >= 5 ? "bg-slate-50" : ""}`}
                />
              ))}
            </div>
            <div className="relative grid min-h-20 grid-cols-7 content-start gap-y-1 pb-2 [grid-auto-flow:row_dense]">
              {dias.map((d, i) => (
                <div key={d} style={{ gridColumn: i + 1, gridRow: 1 }} className="px-2 pt-1.5 text-[13px] tabular-nums">
                  <span
                    className={
                      d === hoy
                        ? "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1 font-bold text-white"
                        : d.slice(0, 7) !== mes
                          ? "text-slate-400"
                          : "text-slate-600"
                    }
                  >
                    {Number(d.slice(8))}
                  </span>
                </div>
              ))}
              {enSemana.map((n) => {
                const inicio = Math.max(0, dias.indexOf(n.desde < dias[0] ? dias[0] : n.desde));
                const fin = n.hasta > dias[6] ? 6 : dias.indexOf(n.hasta);
                return (
                  <a
                    key={n.id}
                    href={`#novedad-${n.id}`}
                    title={`${etiqueta(n)} (${textoRango(n.desde, n.hasta)})`}
                    style={{ ...estiloColor(n.color), gridColumn: `${inicio + 1} / span ${fin - inicio + 1}` }}
                    className={`color-persona truncate px-2 py-0.5 text-xs font-bold hover:brightness-95 ${
                      n.desde >= dias[0] ? "ml-1 rounded-l-md" : ""
                    } ${n.hasta <= dias[6] ? "mr-1 rounded-r-md" : ""}`}
                  >
                    {etiqueta(n)}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Detalle de las novedades del mes, debajo del calendario. */
export function ListaNovedades({
  novedades,
  personas,
  esAdmin,
  hoy,
}: {
  novedades: Novedad[];
  personas: Persona[];
  esAdmin: boolean;
  hoy: string;
}) {
  if (novedades.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        No hay novedades cargadas para este mes.{esAdmin ? " Cargalas con + Novedad." : ""}
      </p>
    );
  }
  return <Acordeon novedades={novedades} personas={personas} esAdmin={esAdmin} hoy={hoy} />;
}

/**
 * Detalle de las novedades plegado: se despliega con un clic y adentro cada novedad es una fila que se abre
 * para ver el texto. La lista muestra unas 5 filas y el resto se recorre con la barra de desplazamiento.
 * Al tocar una barra del calendario (#novedad-<id>) se abre todo y se va a esa novedad.
 */
function Acordeon({ novedades, personas, esAdmin, hoy }: { novedades: Novedad[]; personas: Persona[]; esAdmin: boolean; hoy: string }) {
  const lista = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const abrirDesdeEnlace = () => {
      const item = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!(item instanceof HTMLDetailsElement) || !lista.current?.contains(item)) return;
      lista.current.open = true;
      item.open = true;
      item.scrollIntoView({ block: "nearest" });
      lista.current.scrollIntoView({ block: "start" });
    };
    // También al volver a tocar la misma barra (el enlace no cambia y no hay "hashchange").
    const alTocar = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest('a[href^="#novedad-"]')) setTimeout(abrirDesdeEnlace);
    };
    abrirDesdeEnlace();
    window.addEventListener("hashchange", abrirDesdeEnlace);
    document.addEventListener("click", alTocar);
    return () => {
      window.removeEventListener("hashchange", abrirDesdeEnlace);
      document.removeEventListener("click", alTocar);
    };
  }, []);

  return (
    <details ref={lista} className="card group/lista scroll-mt-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-slate-800 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span>
          Detalle de las novedades del mes <span className="font-normal text-slate-500">({novedades.length})</span>
        </span>
        <span aria-hidden className="text-slate-500 transition-transform group-open/lista:rotate-90">›</span>
      </summary>
      {/* Unas 5 filas visibles; el resto, con la barra de desplazamiento. */}
      <div className="max-h-[14.5rem] divide-y divide-slate-200 overflow-y-auto border-t border-slate-200">
        {novedades.map((n) => (
          <details key={n.id} id={`novedad-${n.id}`} className="group/item scroll-mt-2 open:bg-slate-50/60">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="w-3 shrink-0 text-slate-400 transition-transform group-open/item:rotate-90">›</span>
              <span style={estiloColor(n.color)} className="color-persona shrink-0 rounded-md px-2 py-0.5 text-xs font-bold">
                {n.persona ?? "Todo el equipo"}
              </span>
              <span className="min-w-0 truncate font-bold text-slate-900">{n.titulo}</span>
              <span className="ml-auto shrink-0 text-[13px] text-slate-500">{textoRango(n.desde, n.hasta)}</span>
            </summary>
            <div className="px-4 pb-3 pl-9">
              {n.texto ? <Markdown>{n.texto}</Markdown> : <p className="text-sm text-slate-500">Sin detalle.</p>}
              {esAdmin && (
                <div className="mt-2 -ml-2 flex">
                  <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar novedad" action={editarNovedad.bind(null, n.id)} wide>
                    <Campos n={n} personas={personas} hoy={hoy} />
                  </FormDialog>
                  <DeleteButton action={borrarNovedad.bind(null, n.id)} confirmText={`¿Borrar la novedad "${n.titulo}"?`} />
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
