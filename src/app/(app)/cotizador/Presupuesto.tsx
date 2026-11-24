"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { formatPesos, IVA } from "@/lib/format";

type Datos = { empresa: string; tarea: string; fecha: string };

const fechaLarga = () =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

/**
 * Presupuesto oficial para el cliente: se completa la empresa y la tarea, y se imprime con el diálogo del navegador
 * ("Guardar como PDF"). El documento se arma en un nodo aparte del body que solo se ve al imprimir (ver .presupuesto en globals.css).
 */
export function PresupuestoPdf({ neto, tareaInicial }: { neto: number; tareaInicial: string }) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState<Datos | null>(null);

  if (!abierto) {
    return (
      <button type="button" className="btn" onClick={() => setAbierto(true)}>
        Presupuesto PDF
      </button>
    );
  }

  const iva = Math.round(neto * IVA * 100) / 100;

  return (
    <form
      className="mt-3 w-full space-y-2 rounded-md border border-slate-200 bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const nuevos = { empresa: String(fd.get("empresa")).trim(), tarea: String(fd.get("tarea")).trim(), fecha: fechaLarga() };
        setDatos(nuevos);
        // El nombre sugerido del PDF sale del título de la página.
        const titulo = document.title;
        document.title = `Presupuesto ${nuevos.empresa}`;
        window.addEventListener("afterprint", () => (document.title = titulo), { once: true });
        setTimeout(() => window.print(), 50);
      }}
    >
      <label className="block">
        <span className="label">Empresa</span>
        <input name="empresa" required className="input" placeholder="Ej: Darsie y Cía S.A.C.I." autoFocus />
      </label>
      <label className="block">
        <span className="label">Tarea a realizar</span>
        <textarea name="tarea" required rows={3} defaultValue={tareaInicial} className="input" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Generar PDF
        </button>
        <button type="button" className="btn" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
      <p className="text-xs text-slate-500">Se abre la ventana de impresión: elegí &quot;Guardar como PDF&quot; como destino.</p>

      {datos &&
        createPortal(
          <div className="presupuesto">
            <header className="presupuesto-header">
              <div className="presupuesto-logo">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática para imprimir, sin optimizar */}
                <img src="/logo-flexxus.png" alt="Flexxus" />
                <span>Lo hacemos simple.</span>
              </div>
              <address>
                Humberto Primo 843 - 1º Piso
                <br />
                Córdoba - Argentina
                <br />
                Tel (0351) 5685000
              </address>
            </header>

            <p className="presupuesto-fecha">{datos.fecha}</p>
            <h1>Cotización de Tarea Adicional - Flexxus</h1>
            <p className="presupuesto-empresa">Empresa: {datos.empresa}</p>
            <hr />

            <dl>
              <dt>Costo</dt>
              <dd>
                <strong>{formatPesos(neto)} + IVA</strong>
                <span className="presupuesto-iva">
                  IVA {IVA * 100}%: {formatPesos(iva)} · Total con IVA: {formatPesos(neto + iva)}
                </span>
              </dd>
              <dt>Tarea a realizar</dt>
              <dd className="presupuesto-tarea">{datos.tarea}</dd>
              <dt>Validez del presupuesto</dt>
              <dd>5 días o hasta la finalización del mes en curso, lo que suceda primero.</dd>
              <dt>Tiempo de implementación</dt>
              <dd>72 hs desde la aceptación del presupuesto.</dd>
            </dl>
          </div>,
          document.body,
        )}
    </form>
  );
}
