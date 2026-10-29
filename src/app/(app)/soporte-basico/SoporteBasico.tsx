"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { ahoraArgentina, formatFechaHora, LIMITE_CASOS_MES, ticketUrl } from "@/lib/format";
import { borrarCaso, borrarEmpresa, crearCaso, crearEmpresa, editarCaso, editarEmpresa } from "./actions";

export type EmpresaBasico = {
  id: number;
  nombre: string;
  notas: string;
  activa: boolean;
  casos_mes: number;
  casos_total: number;
  ultimo_ticket: string | null;
};

export type Caso = {
  id: number;
  empresa_id: number;
  empresa: string;
  ticket: string;
  fecha: string;
  notas: string;
  usuario: string | null;
  numero: number;
};

export function TicketLink({ ticket }: { ticket: string }) {
  return (
    <a href={ticketUrl(ticket)} target="_blank" rel="noreferrer" className="font-medium text-blue-700 tabular-nums hover:underline">
      #{ticket} ↗
    </a>
  );
}

/** Estado del cupo mensual de una empresa. */
function Cupo({ usados }: { usados: number }) {
  const quedan = LIMITE_CASOS_MES - usados;
  if (quedan <= 0) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Sin llamadas disponibles</span>;
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        quedan === 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {quedan === 1 ? "Queda 1" : `Quedan ${quedan}`}
    </span>
  );
}

function CamposCaso({ c, empresas }: { c?: Caso; empresas: EmpresaBasico[] }) {
  const [empresaId, setEmpresaId] = useState(c ? String(c.empresa_id) : "");
  const [ticket, setTicket] = useState(c?.ticket ?? "");
  const empresa = empresas.find((e) => String(e.id) === empresaId);
  const numeroTicket = ticket.match(/(\d{1,12})\/?\s*$/)?.[1];

  return (
    <>
      <Field label="Empresa">
        <select name="empresa_id" required value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="input">
          <option value="">Elegí una empresa…</option>
          {empresas
            .filter((e) => e.activa || e.id === c?.empresa_id)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
        </select>
      </Field>
      {empresa && !c && (
        empresa.casos_mes >= LIMITE_CASOS_MES ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            <strong>{empresa.nombre}</strong> no tiene más llamadas disponibles en el mes ({empresa.casos_mes} de {LIMITE_CASOS_MES}{" "}
            usadas). Si lo registrás, queda marcado como excedido; corresponde cotizarlo como tarea adicional.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Este mes: {empresa.casos_mes} de {LIMITE_CASOS_MES} casos usados. Con este quedan{" "}
            {LIMITE_CASOS_MES - empresa.casos_mes - 1}.
          </p>
        )
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número de ticket">
          <input
            name="ticket"
            required
            inputMode="numeric"
            placeholder="123456"
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            className="input"
          />
          {numeroTicket && (
            <a href={ticketUrl(numeroTicket)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Ver ticket #{numeroTicket} ↗
            </a>
          )}
        </Field>
        <Field label="Fecha y hora">
          <input name="fecha" type="datetime-local" required defaultValue={c?.fecha ?? ahoraArgentina()} className="input" />
        </Field>
      </div>
      <Field label="Notas (opcional)">
        <textarea name="notas" rows={2} defaultValue={c?.notas} className="input" />
      </Field>
    </>
  );
}

export function NuevoCaso({ empresas }: { empresas: EmpresaBasico[] }) {
  return (
    <FormDialog trigger="+ Registrar caso" triggerClassName="btn-primary" title="Registrar caso de soporte Básico" action={crearCaso}>
      <CamposCaso empresas={empresas} />
    </FormDialog>
  );
}

function CamposEmpresa({ e }: { e?: EmpresaBasico }) {
  return (
    <>
      <Field label="Nombre (empresa o unidad de negocio)">
        <input name="nombre" defaultValue={e?.nombre} required className="input uppercase" />
      </Field>
      <Field label="Notas">
        <textarea name="notas" defaultValue={e?.notas} rows={2} className="input" />
      </Field>
      {e && (
        <label className="flex items-center gap-2 text-sm">
          <input name="activa" type="checkbox" defaultChecked={e.activa} /> Activa (tiene soporte Básico vigente)
        </label>
      )}
    </>
  );
}

export function Empresas({ empresas }: { empresas: EmpresaBasico[] }) {
  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="titulo">Empresas con soporte Básico · mes actual</h2>
        <FormDialog trigger="+ Empresa" triggerClassName="btn" title="Agregar empresa con soporte Básico" action={crearEmpresa}>
          <CamposEmpresa />
        </FormDialog>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Casos del mes</th>
            <th>Disponibles</th>
            <th>Último ticket</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {empresas.map((e) => (
            <tr key={e.id} className={e.activa ? "" : "opacity-50"}>
              <td>
                <Link href={`/soporte-basico?empresa=${e.id}`} className="font-medium hover:underline">
                  {e.nombre}
                </Link>
                {!e.activa && <span className="ml-1 text-xs text-slate-500">· inactiva</span>}
                {e.notas && <div className="text-xs text-slate-500">{e.notas}</div>}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: LIMITE_CASOS_MES }, (_, i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-4 rounded-sm ${
                          i < e.casos_mes ? (e.casos_mes >= LIMITE_CASOS_MES ? "bg-red-500" : "bg-blue-500") : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="tabular-nums">
                    {e.casos_mes} / {LIMITE_CASOS_MES}
                  </span>
                </div>
              </td>
              <td>{e.activa && <Cupo usados={e.casos_mes} />}</td>
              <td>{e.ultimo_ticket ? <TicketLink ticket={e.ultimo_ticket} /> : <span className="text-slate-400">—</span>}</td>
              <td className="text-right whitespace-nowrap">
                <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar empresa" action={editarEmpresa.bind(null, e.id)}>
                  <CamposEmpresa e={e} />
                </FormDialog>
                <DeleteButton action={borrarEmpresa.bind(null, e.id)} confirmText={`¿Quitar "${e.nombre}" de la lista?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Casos({ casos, empresas }: { casos: Caso[]; empresas: EmpresaBasico[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empresa</th>
            <th>Ticket</th>
            <th>Caso del mes</th>
            <th>Notas</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {casos.map((c) => {
            const excedido = c.numero > LIMITE_CASOS_MES;
            return (
              <tr key={c.id} className={excedido ? "bg-red-50/60" : ""}>
                <td className="whitespace-nowrap tabular-nums">{formatFechaHora(c.fecha)}</td>
                <td className="font-medium">{c.empresa}</td>
                <td>
                  <TicketLink ticket={c.ticket} />
                </td>
                <td className="whitespace-nowrap">
                  <span className={`tabular-nums ${excedido ? "font-bold text-red-700" : ""}`}>
                    {c.numero} de {LIMITE_CASOS_MES}
                  </span>
                  {excedido && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">excedido</span>}
                </td>
                <td className="max-w-xs text-slate-600">
                  {c.notas}
                  {c.usuario && <div className="text-xs text-slate-400">Registró: {c.usuario}</div>}
                </td>
                <td className="text-right whitespace-nowrap">
                  <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar caso" action={editarCaso.bind(null, c.id)}>
                    <CamposCaso c={c} empresas={empresas} />
                  </FormDialog>
                  <DeleteButton action={borrarCaso.bind(null, c.id)} confirmText={`¿Borrar el caso del ticket #${c.ticket}?`} />
                </td>
              </tr>
            );
          })}
          {casos.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-slate-500">
                No hay casos registrados en este mes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
