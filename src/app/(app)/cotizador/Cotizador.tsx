"use client";

import { useState } from "react";
import { CopyButton, DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { formatHoras, formatPesos, IVA } from "@/lib/format";
import { borrarTarea, borrarTipo, crearTarea, crearTipo, editarTarea, editarTipo } from "./actions";

export type TareaCotizable = { id: number; nombre: string; descripcion: string; horas: number };
export type TipoSoporte = { id: number; nombre: string; valor_hora: number; actualizado: string };

function CamposTarea({ t }: { t?: TareaCotizable }) {
  return (
    <>
      <Field label="Tarea">
        <input name="nombre" defaultValue={t?.nombre} required className="input" />
      </Field>
      <Field label="Descripción (opcional)">
        <textarea name="descripcion" defaultValue={t?.descripcion} rows={2} className="input" />
      </Field>
      <Field label="Horas que se cotizan">
        <input name="horas" inputMode="decimal" defaultValue={t?.horas} required className="input" placeholder="Ej: 4 o 1,5" />
      </Field>
    </>
  );
}

function CamposTipo({ t }: { t?: TipoSoporte }) {
  return (
    <>
      <Field label="Tipo de soporte">
        <input name="nombre" defaultValue={t?.nombre} required className="input" />
      </Field>
      <Field label="Valor hora ($, sin IVA)">
        <input name="valor_hora" inputMode="decimal" defaultValue={t?.valor_hora} required className="input" placeholder="Ej: 40000" />
      </Field>
    </>
  );
}

export function Cotizador({ tareas, tipos }: { tareas: TareaCotizable[]; tipos: TipoSoporte[] }) {
  const [tareaId, setTareaId] = useState("");
  const [horas, setHoras] = useState("");
  const [tipoId, setTipoId] = useState("");

  const tarea = tareas.find((t) => String(t.id) === tareaId);
  const tipo = tipos.find((t) => String(t.id) === tipoId);
  const h = Number(horas.replace(",", "."));
  const listo = tipo && h > 0;
  const neto = listo ? Math.round(h * tipo.valor_hora * 100) / 100 : 0;
  const iva = Math.round(neto * IVA * 100) / 100;

  const elegirTarea = (id: string) => {
    setTareaId(id);
    const t = tareas.find((x) => String(x.id) === id);
    if (t) setHoras(String(t.horas));
  };

  const textoCotizacion = listo
    ? [
        `Cotización${tarea ? `: ${tarea.nombre}` : ""}`,
        `${formatHoras(h)} × ${formatPesos(tipo.valor_hora)} (valor hora soporte ${tipo.nombre}) = ${formatPesos(neto)} + IVA`,
        `IVA ${IVA * 100}%: ${formatPesos(iva)} · Total con IVA: ${formatPesos(neto + iva)}`,
      ].join("\n")
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cotizador de tareas adicionales</h1>
        <p className="text-sm text-slate-500">Elegí la tarea (o cargá las horas a mano) y el soporte contratado por la empresa.</p>
      </div>

      <section className="card grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Tarea">
            <select value={tareaId} onChange={(e) => elegirTarea(e.target.value)} className="input">
              <option value="">— Otra / ingresar horas a mano —</option>
              {tareas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({formatHoras(t.horas)})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad de horas">
              <input
                inputMode="decimal"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                className="input"
                placeholder="Ej: 4"
              />
            </Field>
            <Field label="Soporte contratado">
              <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="input">
                <option value="">Elegí…</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {tarea?.descripcion && <p className="text-sm text-slate-500">{tarea.descripcion}</p>}
        </div>

        <div className="flex flex-col justify-center rounded-lg bg-slate-50 p-4">
          {listo ? (
            <>
              <div className="text-sm text-slate-600">
                {formatHoras(h)} × {formatPesos(tipo.valor_hora)} <span className="text-slate-400">(valor hora {tipo.nombre})</span>
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {formatPesos(neto)} <span className="text-lg font-medium text-slate-500">+ IVA</span>
              </div>
              <div className="mt-2 text-sm text-slate-600 tabular-nums">
                IVA {IVA * 100}%: {formatPesos(iva)} · Total con IVA: <strong>{formatPesos(neto + iva)}</strong>
              </div>
              <div className="mt-3">
                <CopyButton text={textoCotizacion} />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Completá las horas y el soporte contratado para ver el total.</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="card overflow-x-auto">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h2 className="font-semibold">Tareas cotizables</h2>
            <FormDialog trigger="+ Tarea" title="Nueva tarea cotizable" action={crearTarea}>
              <CamposTarea />
            </FormDialog>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th className="text-right">Horas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tareas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-medium">{t.nombre}</div>
                    {t.descripcion && <div className="text-xs text-slate-500">{t.descripcion}</div>}
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">{formatHoras(t.horas)}</td>
                  <td className="text-right whitespace-nowrap">
                    <button type="button" className="btn-link" onClick={() => {
                        elegirTarea(String(t.id));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Cotizar
                    </button>
                    <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar tarea" action={editarTarea.bind(null, t.id)}>
                      <CamposTarea t={t} />
                    </FormDialog>
                    <DeleteButton action={borrarTarea.bind(null, t.id)} confirmText={`¿Borrar la tarea "${t.nombre}"?`} />
                  </td>
                </tr>
              ))}
              {tareas.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-slate-500">
                    No hay tareas cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card h-fit overflow-x-auto">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h2 className="font-semibold">Valor hora por tipo de soporte</h2>
            <FormDialog trigger="+ Tipo" title="Nuevo tipo de soporte" action={crearTipo}>
              <CamposTipo />
            </FormDialog>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Soporte</th>
                <th className="text-right">Valor hora</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tipos.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-medium">{t.nombre}</div>
                    <div className="text-xs text-slate-400">Actualizado {t.actualizado}</div>
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">{formatPesos(t.valor_hora)}</td>
                  <td className="text-right whitespace-nowrap">
                    <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar valor hora" action={editarTipo.bind(null, t.id)}>
                      <CamposTipo t={t} />
                    </FormDialog>
                    <DeleteButton action={borrarTipo.bind(null, t.id)} confirmText={`¿Borrar el tipo de soporte "${t.nombre}"?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-slate-500">Valores sin IVA.</p>
        </section>
      </div>
    </div>
  );
}
