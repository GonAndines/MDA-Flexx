"use client";

import { useState } from "react";
import { AYUDA_FORMATO, Markdown } from "./Markdown";

/** Área de texto con pestaña de vista previa del formato. */
export function MarkdownEditor({ name, defaultValue = "", rows = 10 }: { name: string; defaultValue?: string; rows?: number }) {
  const [valor, setValor] = useState(defaultValue);
  const [vista, setVista] = useState(false);
  return (
    <div>
      <div className="mb-1 flex gap-1 text-xs">
        {[
          [false, "Escribir"],
          [true, "Vista previa"],
        ].map(([v, label]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setVista(v as boolean)}
            className={`rounded px-2 py-1 ${vista === v ? "bg-slate-200 font-medium text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {label as string}
          </button>
        ))}
      </div>
      {/* El textarea queda montado (oculto en la vista previa) para que el formulario siempre envíe el texto. */}
      <textarea
        name={name}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={rows}
        className={`input font-mono text-[13px] ${vista ? "hidden" : ""}`}
      />
      {vista && (
        <div className="min-h-32 rounded-md border border-slate-200 p-3">
          {valor.trim() ? <Markdown>{valor}</Markdown> : <p className="text-sm text-slate-400">Nada para mostrar.</p>}
        </div>
      )}
      <p className="mt-1 text-xs text-slate-400">{AYUDA_FORMATO}</p>
    </div>
  );
}
