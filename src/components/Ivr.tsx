"use client";

import { useState } from "react";
import { CENTRAL, IVR, type OpcionIvr } from "@/lib/ivr";

type Columna = { ruta: number[]; titulo: string; opciones: OpcionIvr[] };

/** Una columna por cada menú: el principal y cada submenú, en el orden en que se recorren. */
function columnas(opciones: OpcionIvr[], ruta: number[] = [], titulo = "Menú principal"): Columna[] {
  return [
    { ruta, titulo, opciones },
    ...opciones.flatMap((o) => (o.hijos ? columnas(o.hijos, [...ruta, o.n], o.nombre) : [])),
  ];
}

const COLUMNAS = columnas(IVR);

function buscar(ruta: number[]) {
  let opciones = IVR;
  let nodo: OpcionIvr | undefined;
  for (const n of ruta) {
    nodo = opciones.find((o) => o.n === n);
    opciones = nodo?.hijos ?? [];
  }
  return nodo;
}

const esPrefijo = (a: number[], b: number[]) => a.length <= b.length && a.every((n, i) => b[i] === n);

export function Ivr() {
  const [sel, setSel] = useState<number[]>([]);
  const elegido = sel.length ? buscar(sel) : undefined;

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Derivador de la central telefónica</h2>
        <span className="text-sm text-slate-500">
          Central <strong className="text-slate-700">{CENTRAL.telefono}</strong> · interno{" "}
          <strong className="text-slate-700">{CENTRAL.interno}</strong>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))] xl:grid-cols-[repeat(3,minmax(0,1fr))_15rem]">
        {COLUMNAS.map((col) => (
          <div key={col.ruta.join("-") || "raiz"}>
            <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {col.ruta.length ? `${col.ruta.join("-")} · ${col.titulo}` : col.titulo}
            </div>
            <ul className="space-y-1.5">
              {col.opciones.map((o) => {
                const ruta = [...col.ruta, o.n];
                const actual = sel.length > 0 && ruta.join("-") === sel.join("-");
                const enCamino = sel.length > 0 && esPrefijo(ruta, sel);
                return (
                  <li key={o.n}>
                    <button
                      type="button"
                      onClick={() => setSel(actual ? [] : ruta)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-colors ${
                        actual
                          ? "border-blue-600 bg-blue-600 text-white"
                          : enCamino
                            ? "border-blue-300 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          actual ? "bg-white text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {o.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{o.nombre}</span>
                        {o.detalle && <span className={`block text-xs ${actual ? "text-blue-100" : "text-slate-500"}`}>{o.detalle}</span>}
                      </span>
                      <span className={`shrink-0 font-mono text-xs ${actual ? "text-blue-100" : "text-slate-400"}`}>
                        {ruta.join("-")}
                        {o.hijos && " ›"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 p-4 text-center md:col-span-3 xl:col-span-1">
          {elegido ? (
            <>
              <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Para derivar a</div>
              <div className="mt-1 font-semibold text-slate-900">{elegido.nombre}</div>
              <div className="mt-2 flex items-center gap-1.5" aria-label={`Marcar ${sel.join(", ")}`}>
                {sel.map((n, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-slate-400">→</span>}
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">{n}</span>
                  </span>
                ))}
              </div>
              {elegido.hijos && <div className="mt-2 text-xs text-slate-500">Tiene submenú: elegí una opción más.</div>}
              {elegido.detalle && <div className="mt-2 text-xs text-slate-500">{elegido.detalle}</div>}
            </>
          ) : (
            <p className="text-sm text-slate-500">Tocá un destino para ver qué opciones marcar.</p>
          )}
        </div>
      </div>
    </section>
  );
}
