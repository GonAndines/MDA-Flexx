"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

export type ActionResult = { error?: string } | void;

/** Botón que abre un diálogo con un formulario y ejecuta una acción del servidor al guardar. */
export function FormDialog({
  trigger,
  triggerClassName = "btn",
  title,
  action,
  submitLabel = "Guardar",
  wide = false,
  children,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  title: string;
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Cambia en cada apertura para remontar los campos: así arrancan limpios con sus valores iniciales.
  const [apertura, setApertura] = useState(0);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setError(null);
          setApertura((n) => n + 1);
          dialog.current?.showModal();
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className={`m-auto w-[calc(100%-2rem)] rounded-xl bg-surface p-0 text-left text-[inherit] shadow-2xl backdrop:bg-black/50 ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await action(fd);
              if (r && r.error) setError(r.error);
              else dialog.current?.close();
            });
          }}
        >
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{title}</h2>
          </div>
          <div key={apertura} className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
            {apertura > 0 && children}
          </div>
          {error && <p className="mx-5 mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
