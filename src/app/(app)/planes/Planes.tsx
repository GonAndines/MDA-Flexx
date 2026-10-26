"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { formatPesos } from "@/lib/format";
import { borrarEmpresa, borrarPlan, crearEmpresa, crearPlan, editarEmpresa, editarPlan } from "./actions";

export type Plan = {
  id: number;
  nombre: string;
  descripcion: string;
  incluye: string;
  horario: string;
  tiempo_respuesta: string;
  llamadas_mes: number | null;
  abono_mensual: number | null;
  empresas: number;
};

export type Empresa = {
  id: number;
  nombre: string;
  cuit: string;
  contacto: string;
  telefono: string;
  email: string;
  plan_id: number | null;
  notas: string;
  activa: boolean;
  llamadas_mes: number;
};

function CamposPlan({ p }: { p?: Plan }) {
  return (
    <>
      <Field label="Nombre">
        <input name="nombre" defaultValue={p?.nombre} required className="input" />
      </Field>
      <Field label="Descripción breve">
        <input name="descripcion" defaultValue={p?.descripcion} className="input" />
      </Field>
      <Field label="Qué incluye (un ítem por línea)">
        <textarea name="incluye" defaultValue={p?.incluye} rows={5} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Horario de atención">
          <input name="horario" defaultValue={p?.horario} className="input" />
        </Field>
        <Field label="Tiempo de respuesta">
          <input name="tiempo_respuesta" defaultValue={p?.tiempo_respuesta} className="input" />
        </Field>
        <Field label="Llamadas incluidas por mes (vacío = sin límite)">
          <input name="llamadas_mes" type="number" min="0" step="1" defaultValue={p?.llamadas_mes ?? ""} className="input" />
        </Field>
        <Field label="Abono mensual $ (vacío = sin abono)">
          <input name="abono_mensual" type="number" min="0" step="0.01" defaultValue={p?.abono_mensual ?? ""} className="input" />
        </Field>
      </div>
    </>
  );
}

function CamposEmpresa({ e, planes }: { e?: Empresa; planes: Plan[] }) {
  return (
    <>
      <Field label="Nombre / razón social">
        <input name="nombre" defaultValue={e?.nombre} required className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="CUIT">
          <input name="cuit" defaultValue={e?.cuit} className="input" />
        </Field>
        <Field label="Plan de soporte">
          <select name="plan_id" defaultValue={e?.plan_id ?? ""} className="input">
            <option value="">(sin asignar)</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contacto principal">
          <input name="contacto" defaultValue={e?.contacto} className="input" />
        </Field>
        <Field label="Teléfono">
          <input name="telefono" defaultValue={e?.telefono} className="input" />
        </Field>
      </div>
      <Field label="Email">
        <input name="email" type="email" defaultValue={e?.email} className="input" />
      </Field>
      <Field label="Notas">
        <textarea name="notas" defaultValue={e?.notas} rows={2} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input name="activa" type="checkbox" defaultChecked={e?.activa ?? true} /> Empresa activa
      </label>
    </>
  );
}

export function Planes({ planes, empresas }: { planes: Plan[]; empresas: Empresa[] }) {
  const [filtroPlan, setFiltroPlan] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const planPorId = new Map(planes.map((p) => [p.id, p]));

  const visibles = empresas.filter(
    (e) =>
      (!filtroPlan || String(e.plan_id ?? "") === filtroPlan) &&
      (!busqueda || `${e.nombre} ${e.cuit} ${e.contacto}`.toLowerCase().includes(busqueda.toLowerCase())),
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Tipos de soporte</h1>
            <p className="text-sm text-slate-500">Qué incluye cada plan contratado.</p>
          </div>
          <FormDialog trigger="+ Nuevo plan" triggerClassName="btn-primary" title="Nuevo plan" action={crearPlan} wide>
            <CamposPlan />
          </FormDialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {planes.map((p) => (
            <article key={p.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.nombre}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {p.empresas} empresa{p.empresas === 1 ? "" : "s"}
                </span>
              </div>
              {p.descripcion && <p className="mt-1 text-sm text-slate-500">{p.descripcion}</p>}
              {p.incluye && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {p.incluye.split("\n").filter(Boolean).map((linea, i) => (
                    <li key={i}>{linea}</li>
                  ))}
                </ul>
              )}
              <dl className="mt-3 grid flex-1 grid-cols-2 content-end gap-x-3 gap-y-1 text-xs">
                <dt className="text-slate-500">Horario</dt>
                <dd>{p.horario || "—"}</dd>
                <dt className="text-slate-500">Respuesta</dt>
                <dd>{p.tiempo_respuesta || "—"}</dd>
                <dt className="text-slate-500">Llamadas/mes</dt>
                <dd>{p.llamadas_mes === null ? "Sin límite" : p.llamadas_mes}</dd>
                <dt className="text-slate-500">Abono mensual</dt>
                <dd>{p.abono_mensual === null ? "Sin abono" : formatPesos(p.abono_mensual)}</dd>
              </dl>
              <div className="mt-3 flex gap-1 border-t border-slate-100 pt-2">
                <FormDialog trigger="Editar" triggerClassName="btn-link" title={`Editar plan ${p.nombre}`} action={editarPlan.bind(null, p.id)} wide>
                  <CamposPlan p={p} />
                </FormDialog>
                <DeleteButton action={borrarPlan.bind(null, p.id)} confirmText={`¿Borrar el plan "${p.nombre}"?`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Empresas y su plan</h2>
            <p className="text-sm text-slate-500">Llamadas del mes contra las incluidas en el plan.</p>
          </div>
          <FormDialog trigger="+ Nueva empresa" triggerClassName="btn-primary" title="Nueva empresa" action={crearEmpresa} wide>
            <CamposEmpresa planes={planes} />
          </FormDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar empresa, CUIT o contacto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select value={filtroPlan} onChange={(e) => setFiltroPlan(e.target.value)} className="input max-w-[14rem]">
            <option value="">Todos los planes</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Contacto</th>
                <th className="text-right">Llamadas del mes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => {
                const plan = e.plan_id ? planPorId.get(e.plan_id) : undefined;
                const limite = plan?.llamadas_mes ?? null;
                const excedida = limite !== null && e.llamadas_mes > limite;
                return (
                  <tr key={e.id} className={e.activa ? "" : "opacity-50"}>
                    <td>
                      <div className="font-medium">{e.nombre}</div>
                      <div className="text-xs text-slate-500">
                        {e.cuit}
                        {!e.activa && " · inactiva"}
                      </div>
                    </td>
                    <td>{plan?.nombre ?? <span className="text-slate-400">Sin asignar</span>}</td>
                    <td>
                      <div>{e.contacto}</div>
                      <div className="text-xs text-slate-500">{[e.telefono, e.email].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td className={`text-right tabular-nums ${excedida ? "font-semibold text-red-600" : ""}`}>
                      {e.llamadas_mes}
                      {limite !== null && ` / ${limite}`}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar empresa" action={editarEmpresa.bind(null, e.id)} wide>
                        <CamposEmpresa e={e} planes={planes} />
                      </FormDialog>
                      <DeleteButton action={borrarEmpresa.bind(null, e.id)} confirmText={`¿Borrar la empresa "${e.nombre}"?`} />
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500">
                    No hay empresas que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
