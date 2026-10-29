"use client";

import { useState, useTransition } from "react";
import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog, type ActionResult } from "@/components/FormDialog";
import { agregarFechas, asignarSabado, borrarSabado, crearAgente, editarAgente, liberar, postularme } from "./sabados-actions";

export type Sabado = {
  id: number;
  fecha: string;
  tanda: number;
  feriado: boolean;
  activa_id: number | null;
  pasiva_id: number | null;
  activa: string | null;
  pasiva: string | null;
  futuro: boolean;
  vigente: boolean;
};
export type Agente = { id: number; nombre: string; usuario_id: number | null; usuario: string | null; activo: boolean };

const LIMITE = 2;
const ROLES = [
  ["activa", "Activa"],
  ["pasiva", "Pasiva"],
] as const;
type Rol = (typeof ROLES)[number][0];

const fecha = (iso: string) => iso.split("-").reverse().join("/");

/** Botón chico que ejecuta una acción del servidor y avisa si devolvió un error. */
function Accion({ label, action, className = "btn-link" }: { label: string; action: () => Promise<ActionResult>; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await action();
          if (r && r.error) alert(r.error);
        })
      }
    >
      {pending ? "…" : label}
    </button>
  );
}

/** Agente asignado (con "Liberar" si es uno mismo), botón "Postularme" si el lugar está libre, o un guion. */
function Celda({ s, rol, miAgenteId, conCupo }: { s: Sabado; rol: Rol; miAgenteId: number | null; conCupo: boolean }) {
  const id = rol === "activa" ? s.activa_id : s.pasiva_id;
  const nombre = rol === "activa" ? s.activa : s.pasiva;
  const otro = rol === "activa" ? s.pasiva_id : s.activa_id;
  if (s.feriado) return <span className="text-slate-400">Feriado</span>;
  if (id) {
    const mio = id === miAgenteId;
    return (
      <span className="flex flex-wrap items-center gap-1">
        <span className={mio ? "font-bold text-blue-800" : ""}>
          {nombre}
          {mio && " (vos)"}
        </span>
        {mio && s.futuro && <Accion label="Liberar" className="btn-danger text-xs" action={() => liberar(s.id, rol)} />}
      </span>
    );
  }
  return s.futuro && conCupo && otro !== miAgenteId ? (
    <Accion label="Postularme" className="btn text-xs" action={() => postularme(s.id, rol)} />
  ) : (
    <span className="text-slate-400">—</span>
  );
}

function CamposSabado({ s, agentes }: { s: Sabado; agentes: Agente[] }) {
  const [feriado, setFeriado] = useState(s.feriado);
  const opciones = agentes.filter((a) => a.activo || a.id === s.activa_id || a.id === s.pasiva_id);
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <input name="feriado" type="checkbox" checked={feriado} onChange={(e) => setFeriado(e.target.checked)} /> Feriado (sin atención)
      </label>
      {!feriado &&
        ROLES.map(([rol, label]) => (
          <Field key={rol} label={`Atención ${label.toLowerCase()}`}>
            <select name={`${rol}_id`} defaultValue={(rol === "activa" ? s.activa_id : s.pasiva_id) ?? ""} className="input">
              <option value="">— Sin asignar —</option>
              {opciones.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </Field>
        ))}
    </>
  );
}

function CamposAgente({ a, usuarios }: { a?: Agente; usuarios: { id: number; nombre: string }[] }) {
  return (
    <>
      <Field label="Nombre que se muestra en el cronograma">
        <input name="nombre" defaultValue={a?.nombre} required className="input" />
      </Field>
      <Field label="Usuario de la plataforma">
        <select name="usuario_id" defaultValue={a?.usuario_id ?? ""} className="input">
          <option value="">— Sin vincular —</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </Field>
      {a && (
        <label className="flex items-center gap-2 text-sm">
          <input name="activo" type="checkbox" defaultChecked={a.activo} /> Activo (participa de los sábados)
        </label>
      )}
    </>
  );
}

export function Sabados({
  sabados,
  agentes,
  usuarios,
  miAgenteId,
  esAdmin,
}: {
  sabados: Sabado[];
  agentes: Agente[];
  usuarios: { id: number; nombre: string }[];
  miAgenteId: number | null;
  esAdmin: boolean;
}) {
  const [verAnteriores, setVerAnteriores] = useState(false);
  const proximo = sabados.find((s) => s.vigente && !s.feriado);
  const anteriores = sabados.filter((s) => !s.vigente);
  const visibles = verAnteriores ? sabados : sabados.filter((s) => s.vigente);
  const ultima = sabados.at(-1);
  const tandaActual = ultima?.tanda;

  /** Cuántos sábados tiene el agente en una tanda para un rol. */
  const usados = (tanda: number, rol: Rol) =>
    sabados.filter((s) => s.tanda === tanda && (rol === "activa" ? s.activa_id : s.pasiva_id) === miAgenteId).length;

  const celda = (s: Sabado, rol: Rol) => (
    <Celda s={s} rol={rol} miAgenteId={miAgenteId} conCupo={miAgenteId !== null && usados(s.tanda, rol) < LIMITE} />
  );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="titulo">Atención de los sábados</h2>
        {esAdmin && (
          <FormDialog trigger="+ Agregar fechas" triggerClassName="btn" title="Agregar sábados" action={agregarFechas} submitLabel="Agregar">
            <p className="text-sm text-slate-600">
              Se agregan sábados seguidos {ultima ? `a continuación del ${fecha(ultima.fecha)}` : "desde el próximo sábado"}, como un período
              nuevo: cada agente puede postularse a {LIMITE} sábados de atención activa y {LIMITE} de pasiva en ese período.
            </p>
            <Field label="Cantidad de sábados">
              <input name="cantidad" type="number" min="1" max="60" defaultValue={14} required className="input w-32" />
            </Field>
          </FormDialog>
        )}
      </div>

      {proximo ? (
        <div className="mb-4 rounded-[10px] border-l-4 border-amber-600 bg-amber-50 px-4 py-3">
          <div className="text-[13px] font-bold text-amber-800">Próximo sábado, {fecha(proximo.fecha)}</div>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              Activa: <strong className="text-slate-900">{proximo.activa ?? "sin asignar"}</strong>
            </span>
            <span>
              Pasiva: <strong className="text-slate-900">{proximo.pasiva ?? "sin asignar"}</strong>
            </span>
          </div>
        </div>
      ) : (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          No hay sábados cargados a futuro.{esAdmin ? " Agregá las próximas fechas." : " Un administrador tiene que agregar las próximas fechas."}
        </p>
      )}

      {miAgenteId && tandaActual !== undefined && (
        <p className="mb-2 text-xs text-slate-500">
          Tus sábados en el período actual: activa {usados(tandaActual, "activa")}/{LIMITE} · pasiva {usados(tandaActual, "pasiva")}/{LIMITE}
        </p>
      )}
      {!miAgenteId && (
        <p className="mb-2 text-xs text-slate-500">Tu usuario no figura como agente activo de los sábados.</p>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Sábado</th>
              <th>Atención activa</th>
              <th>Atención pasiva</th>
              {esAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {visibles.map((s) => (
              <tr key={s.id} className={s.id === proximo?.id ? "bg-amber-50/70" : !s.vigente ? "text-slate-500" : ""}>
                <td className="whitespace-nowrap tabular-nums">
                  {fecha(s.fecha)}
                  {s.id === proximo?.id && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Próximo</span>}
                </td>
                <td>{celda(s, "activa")}</td>
                <td>{celda(s, "pasiva")}</td>
                {esAdmin && (
                  <td className="text-right whitespace-nowrap">
                    <FormDialog trigger="Editar" triggerClassName="btn-link" title={`Sábado ${fecha(s.fecha)}`} action={asignarSabado.bind(null, s.id)}>
                      <CamposSabado s={s} agentes={agentes} />
                    </FormDialog>
                    <DeleteButton action={borrarSabado.bind(null, s.id)} confirmText={`¿Quitar el sábado ${fecha(s.fecha)} del cronograma?`} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {anteriores.length > 0 && (
        <button type="button" className="btn-link mt-2" onClick={() => setVerAnteriores(!verAnteriores)}>
          {verAnteriores ? "Ocultar sábados anteriores" : `Ver sábados anteriores (${anteriores.length})`}
        </button>
      )}

      {esAdmin && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Agentes de los sábados ({agentes.length})</summary>
          <p className="mt-2 text-xs text-slate-500">
            Cada usuario de la plataforma es agente automáticamente. Si su primer nombre coincide con un nombre del cronograma anterior, se
            vincula solo; si no (por ejemplo, un apodo), editá ese nombre y elegí el usuario. Los nombres sin usuario no pueden postularse.
          </p>
          <div className="mt-2 flex justify-end">
            <FormDialog trigger="+ Agente" title="Nuevo agente" action={crearAgente}>
              <CamposAgente usuarios={usuarios} />
            </FormDialog>
          </div>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Agente</th>
                <th>Usuario vinculado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agentes.map((a) => (
                <tr key={a.id} className={a.activo ? "" : "opacity-50"}>
                  <td className="font-medium">
                    {a.nombre}
                    {!a.activo && <span className="ml-1 text-xs text-slate-500">· inactivo</span>}
                  </td>
                  <td>{a.usuario ?? <span className="text-amber-700">Sin vincular</span>}</td>
                  <td className="text-right">
                    <FormDialog trigger="Editar" triggerClassName="btn-link" title={`Agente ${a.nombre}`} action={editarAgente.bind(null, a.id)}>
                      <CamposAgente a={a} usuarios={usuarios} />
                    </FormDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
