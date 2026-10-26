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

export function CopyButton({ text }: { text: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={copiado ? "btn border-emerald-300 text-emerald-700" : "btn"}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
    >
      {copiado ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
