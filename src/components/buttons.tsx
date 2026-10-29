"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "./FormDialog";

export function DeleteButton({ action, confirmText }: { action: () => Promise<ActionResult>; confirmText: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        startTransition(async () => {
          const r = await action();
          if (r && r.error) alert(r.error);
        });
      }}
    >
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}

/** Copia al portapapeles; si la API moderna no está permitida, usa el método clásico con una selección temporal. */
async function copiar(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyButton({ text }: { text: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  return (
    <button
      type="button"
      className={`btn ${
        estado === "ok" ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-600" : estado === "error" ? "border-red-300 text-red-700" : ""
      }`}
      onClick={async () => {
        setEstado((await copiar(text)) ? "ok" : "error");
        setTimeout(() => setEstado(""), 1500);
      }}
    >
      {estado === "ok" ? "Copiado" : estado === "error" ? "No se pudo copiar" : "Copiar"}
    </button>
  );
}
