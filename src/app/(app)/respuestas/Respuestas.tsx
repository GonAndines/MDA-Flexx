"use client";

import { useMemo, useState } from "react";
import { CopyButton, DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { borrarRespuesta, crearRespuesta, editarRespuesta } from "./actions";

export type Respuesta = { id: number; titulo: string; categoria: string; texto: string };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Campos({ r, categorias }: { r?: Respuesta; categorias: string[] }) {
  return (
    <>
      <Field label="Título">
        <input name="titulo" defaultValue={r?.titulo} required className="input" />
      </Field>
      <Field label="Categoría">
        <input name="categoria" defaultValue={r?.categoria ?? "General"} list="categorias" className="input" />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Texto">
        <textarea name="texto" defaultValue={r?.texto} required rows={6} className="input" />
      </Field>
    </>
  );
}

export function Respuestas({ respuestas }: { respuestas: Respuesta[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const categorias = useMemo(() => [...new Set(respuestas.map((r) => r.categoria))].sort(), [respuestas]);

  // Coincide si aparecen todas las palabras buscadas, sin importar acentos ni el orden.
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const filtradas = respuestas.filter((r) => {
    if (categoria && r.categoria !== categoria) return false;
    const contenido = normalizar(`${r.titulo} ${r.texto} ${r.categoria}`);
    return palabras.every((p) => contenido.includes(p));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo-pagina">Respuestas rápidas</h1>
        <FormDialog trigger="+ Nueva respuesta" triggerClassName="btn-primary" title="Nueva respuesta" action={crearRespuesta}>
          <Campos categorias={categorias} />
        </FormDialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar por título, texto o categoría…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input max-w-md"
        />
        <div className="flex flex-wrap gap-1">
          {["", ...categorias].map((c) => (
            <button
              key={c || "todas"}
              type="button"
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3 py-1 text-sm ${
                categoria === c ? "bg-blue-600 text-white" : "bg-surface text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {c || "Todas"}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 && <p className="text-sm text-slate-500">No hay respuestas que coincidan.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {filtradas.map((r) => (
          <article key={r.id} className="card flex flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="font-medium text-slate-800">{r.titulo}</h2>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{r.categoria}</span>
            </div>
            <p className="flex-1 text-sm whitespace-pre-wrap text-slate-600">{r.texto}</p>
            <div className="mt-3 flex items-center gap-1">
              <CopyButton text={r.texto} />
              <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar respuesta" action={editarRespuesta.bind(null, r.id)}>
                <Campos r={r} categorias={categorias} />
              </FormDialog>
              <DeleteButton action={borrarRespuesta.bind(null, r.id)} confirmText={`¿Borrar la respuesta "${r.titulo}"?`} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
