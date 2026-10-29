"use client";

import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { Markdown } from "@/components/Markdown";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { borrarNovedad, crearNovedad, editarNovedad } from "./actions";

export type Novedad = { id: number; mes: string; titulo: string; texto: string; autor: string | null; creado: string };

function Campos({ n, mes }: { n?: Novedad; mes: string }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_11rem] gap-3">
        <Field label="Título">
          <input name="titulo" defaultValue={n?.titulo} required className="input" />
        </Field>
        <Field label="Mes">
          <input name="mes" type="month" defaultValue={n?.mes ?? mes} required className="input" />
        </Field>
      </div>
      <Field label="Detalle">
        <MarkdownEditor name="texto" defaultValue={n?.texto} rows={8} />
      </Field>
    </>
  );
}

export function NuevaNovedad({ mes }: { mes: string }) {
  return (
    <FormDialog trigger="+ Novedad" triggerClassName="btn-primary" title="Nueva novedad del equipo" action={crearNovedad} wide>
      <Campos mes={mes} />
    </FormDialog>
  );
}

export function ListaNovedades({ novedades, mes }: { novedades: Novedad[]; mes: string }) {
  if (novedades.length === 0) {
    return <p className="rounded-[10px] border border-dashed border-slate-300 p-6 text-sm text-slate-500">No hay novedades cargadas para este mes. Usá el botón de arriba para agregar la primera.</p>;
  }
  return (
    <div className="card divide-y divide-slate-200">
      {novedades.map((n) => (
        <article key={n.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-slate-900">{n.titulo}</h3>
            <div className="flex shrink-0">
              <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar novedad" action={editarNovedad.bind(null, n.id)} wide>
                <Campos n={n} mes={mes} />
              </FormDialog>
              <DeleteButton action={borrarNovedad.bind(null, n.id)} confirmText={`¿Borrar la novedad "${n.titulo}"?`} />
            </div>
          </div>
          {n.texto && <Markdown className="mt-2">{n.texto}</Markdown>}
          <p className="mt-3 text-[13px] text-slate-500">
            {n.autor ? `${n.autor}, ` : ""}
            {n.creado}
          </p>
        </article>
      ))}
    </div>
  );
}
