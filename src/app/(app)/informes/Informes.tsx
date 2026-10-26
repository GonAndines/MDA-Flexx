"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, FormDialog } from "@/components/FormDialog";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { CATEGORIAS_SUGERIDAS } from "@/lib/informes";
import { crearInforme } from "./actions";

export type Informe = { id: number; titulo: string; categoria: string; contenido: string; autor: string | null; actualizado: string };


const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Resumen en texto plano de un contenido con formato, para el listado. */
function extracto(md: string) {
  const plano = md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plano.length > 180 ? plano.slice(0, 180) + "…" : plano;
}

export function CamposInforme({ i, categorias }: { i?: Informe; categorias: string[] }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_14rem] gap-3">
        <Field label="Título">
          <input name="titulo" defaultValue={i?.titulo} required className="input" />
        </Field>
        <Field label="Categoría">
          <input name="categoria" defaultValue={i?.categoria ?? ""} list="categorias-informes" className="input" />
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

export function Informes({ informes }: { informes: Informe[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const categorias = [...new Set([...CATEGORIAS_SUGERIDAS, ...informes.map((i) => i.categoria)])].sort();
  const usadas = [...new Set(informes.map((i) => i.categoria))].sort();

  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const visibles = informes.filter((i) => {
    if (categoria && i.categoria !== categoria) return false;
    const contenido = normalizar(`${i.titulo} ${i.categoria} ${i.contenido}`);
    return palabras.every((p) => contenido.includes(p));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Informes</h1>
          <p className="text-sm text-slate-500">Notas de release, uso del sistema, procedimientos y otra información relevante.</p>
        </div>
        <FormDialog trigger="+ Nuevo informe" triggerClassName="btn-primary" title="Nuevo informe" action={crearInforme} wide>
          <CamposInforme categorias={categorias} />
        </FormDialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar en títulos y contenido…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input max-w-md"
        />
        <div className="flex flex-wrap gap-1">
          {["", ...usadas].map((c) => (
            <button
              key={c || "todas"}
              type="button"
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3 py-1 text-sm ${
                categoria === c ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {c || "Todas"}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 && <p className="text-sm text-slate-500">No hay informes que coincidan.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {visibles.map((i) => (
          <Link key={i.id} href={`/informes/${i.id}`} className="card block p-4 hover:border-blue-300">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="font-medium text-slate-900">{i.titulo}</h2>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{i.categoria}</span>
            </div>
            <p className="text-sm text-slate-600">{extracto(i.contenido)}</p>
            <p className="mt-2 text-xs text-slate-400">
              Actualizado {i.actualizado}
              {i.autor ? ` por ${i.autor}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
