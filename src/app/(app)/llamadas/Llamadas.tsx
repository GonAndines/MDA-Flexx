"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { ahoraArgentina, ESTADOS, formatFechaHora, type Estado } from "@/lib/format";
import { borrarLlamada, crearLlamada, editarLlamada } from "./actions";

export type Llamada = {
  id: number;
  empresa_id: number;
  empresa: string;
  contacto: string;
  fecha: string;
  motivo: string;
  estado: Estado;
  resolucion: string;
  usuario: string | null;
};

export type EmpresaOpcion = {
  id: number;
  nombre: string;
  contacto: string;
  activa: boolean;
  plan: string | null;
  limite: number | null;
  usadas: number;
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const e = ESTADOS[estado];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${e.clase}`}>{e.label}</span>;
}

/** Aviso según el plan de la empresa elegida (sin plan, sin soporte o llamadas del mes agotadas). */
function AvisoPlan({ empresa }: { empresa?: EmpresaOpcion }) {
  if (!empresa) return null;
  let aviso: string | null = null;
  if (!empresa.plan) aviso = "La empresa no tiene plan asignado.";
  else if (empresa.limite === 0) aviso = `Plan "${empresa.plan}": no incluye llamadas. Corresponde presupuestar como tarea adicional.`;
  else if (empresa.limite !== null && empresa.usadas >= empresa.limite)
    aviso = `Plan "${empresa.plan}": ya usó ${empresa.usadas} de ${empresa.limite} llamadas incluidas este mes.`;
  return aviso ? (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{aviso}</p>
  ) : (
    <p className="text-xs text-slate-500">
      Plan {empresa.plan} · {empresa.usadas} llamada{empresa.usadas === 1 ? "" : "s"} este mes
      {empresa.limite !== null && ` de ${empresa.limite}`}
    </p>
  );
}

function Campos({ l, empresas }: { l?: Llamada; empresas: EmpresaOpcion[] }) {
  const [empresaId, setEmpresaId] = useState(l?.empresa_id ? String(l.empresa_id) : "");
  const [contacto, setContacto] = useState(l?.contacto ?? "");
  const empresa = empresas.find((e) => String(e.id) === empresaId);

  return (
    <>
      <Field label="Empresa">
        <select
          name="empresa_id"
          required
          value={empresaId}
          onChange={(ev) => {
            setEmpresaId(ev.target.value);
            const e = empresas.find((x) => String(x.id) === ev.target.value);
            if (e && !contacto) setContacto(e.contacto);
          }}
          className="input"
        >
          <option value="">Elegí una empresa…</option>
          {empresas
            .filter((e) => e.activa || e.id === l?.empresa_id)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {e.plan ? ` — ${e.plan}` : ""}
              </option>
            ))}
        </select>
      </Field>
      <AvisoPlan empresa={empresa} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contacto">
          <input name="contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} className="input" />
        </Field>
        <Field label="Fecha y hora">
          <input name="fecha" type="datetime-local" required defaultValue={l?.fecha ?? ahoraArgentina()} className="input" />
        </Field>
      </div>
      <Field label="Motivo">
        <textarea name="motivo" required rows={2} defaultValue={l?.motivo} className="input" />
      </Field>
      <Field label="Estado">
        <select name="estado" defaultValue={l?.estado ?? "pendiente"} className="input">
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Resolución">
        <textarea name="resolucion" rows={3} defaultValue={l?.resolucion} className="input" />
      </Field>
    </>
  );
}

export function NuevaLlamada({ empresas }: { empresas: EmpresaOpcion[] }) {
  return (
    <FormDialog trigger="+ Registrar llamada" triggerClassName="btn-primary" title="Registrar llamada" action={crearLlamada} wide>
      <Campos empresas={empresas} />
    </FormDialog>
  );
}

export function TablaLlamadas({ llamadas, empresas }: { llamadas: Llamada[]; empresas: EmpresaOpcion[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empresa / contacto</th>
            <th>Motivo y resolución</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {llamadas.map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap tabular-nums">{formatFechaHora(l.fecha)}</td>
              <td>
                <div className="font-medium">{l.empresa}</div>
                <div className="text-xs text-slate-500">{l.contacto}</div>
              </td>
              <td className="max-w-md">
                <div>{l.motivo}</div>
                {l.resolucion && <div className="mt-0.5 text-xs text-slate-500">↳ {l.resolucion}</div>}
                {l.usuario && <div className="mt-0.5 text-xs text-slate-400">Registró: {l.usuario}</div>}
              </td>
              <td>
                <EstadoBadge estado={l.estado} />
              </td>
              <td className="text-right whitespace-nowrap">
                <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar llamada" action={editarLlamada.bind(null, l.id)} wide>
                  <Campos l={l} empresas={empresas} />
                </FormDialog>
                <DeleteButton action={borrarLlamada.bind(null, l.id)} confirmText="¿Borrar esta llamada?" />
              </td>
            </tr>
          ))}
          {llamadas.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-slate-500">
                No hay llamadas con estos filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
