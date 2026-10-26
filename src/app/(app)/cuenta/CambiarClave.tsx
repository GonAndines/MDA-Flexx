"use client";

import { useActionState } from "react";
import { Field } from "@/components/FormDialog";
import { cambiarClave } from "./actions";

export function CambiarClave() {
  const [state, action, pending] = useActionState(cambiarClave, null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Contraseña actual">
        <input name="actual" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <Field label="Nueva contraseña (mínimo 8 caracteres)">
        <input name="nueva" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      <Field label="Repetí la nueva contraseña">
        <input name="repetida" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Listo, tu contraseña se cambió.</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
