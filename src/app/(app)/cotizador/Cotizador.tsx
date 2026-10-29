"use client";

import { useState } from "react";
import { CopyButton, DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { formatHoras, formatPesos, IVA } from "@/lib/format";
import { borrarTarea, crearTarea, editarTarea, editarTarifa } from "./actions";

export type Tarifa = {
  id: number;
  nombre: string;
  visita_primera: number;
  visita_restantes: number;
  remota_hora: number;
  actualizado: string;
};
export type TipoSoporte = { id: number; nombre: string; tarifa_id: number };
export type Modo = "horas" | "no_aplica" | "a_cotizar" | "fijo";
export type Celda = { tipo_id: number; modo: Modo; valor: number | null };
export type TareaCotizable = { id: number; nombre: string; descripcion: string; celdas: Record<number, Celda> };

type Modalidad = "remota" | "visita";

const ETIQUETA_MODO: Record<Modo, string> = {
  horas: "Horas",
  no_aplica: "– (no aplica)",
  a_cotizar: "A cotizar",
  fijo: "Valor fijo",
};

function textoCelda(c: Celda | undefined) {
  if (!c) return "—";
  if (c.modo === "horas") return formatHoras(c.valor ?? 0);
  if (c.modo === "fijo") return c.valor === null ? "Valor fijo" : formatPesos(c.valor);
  if (c.modo === "a_cotizar") return "A cotizar";
  return "–";
}

/** Importe sin IVA según la modalidad: remota = horas × valor hora; visita = primera hora + horas restantes. */
function calcular(horas: number, tarifa: Tarifa, modalidad: Modalidad) {
  if (modalidad === "remota") {
    return { neto: horas * tarifa.remota_hora, detalle: `${formatHoras(horas)} × ${formatPesos(tarifa.remota_hora)}` };
  }
  const restantes = Math.max(0, horas - 1);
  return {
    neto: tarifa.visita_primera + restantes * tarifa.visita_restantes,
    detalle:
      `Primera hora ${formatPesos(tarifa.visita_primera)}` +
      (restantes > 0 ? ` + ${formatHoras(restantes)} × ${formatPesos(tarifa.visita_restantes)}` : ""),
  };
}

function CamposTarea({ t, tipos }: { t?: TareaCotizable; tipos: TipoSoporte[] }) {
  const [modos, setModos] = useState<Record<number, Modo>>(() =>
    Object.fromEntries(tipos.map((tipo) => [tipo.id, t?.celdas[tipo.id]?.modo ?? "horas"])),
  );
  return (
    <>
      <Field label="Tarea">
        <input name="nombre" defaultValue={t?.nombre} required className="input" />
      </Field>
      <Field label="Descripción (opcional)">
        <input name="descripcion" defaultValue={t?.descripcion} className="input" />
      </Field>
      <div>
        <span className="label">Qué se cotiza según el soporte contratado</span>
        <div className="space-y-2 rounded-md border border-slate-200 p-3">
          {tipos.map((tipo) => {
            const modo = modos[tipo.id];
            const conValor = modo === "horas" || modo === "fijo";
            return (
              <div key={tipo.id} className="grid grid-cols-[8rem_1fr_8rem] items-center gap-2">
                <span className="text-sm font-medium">{tipo.nombre}</span>
                <select
                  name={`modo_${tipo.id}`}
                  value={modo}
                  onChange={(e) => setModos({ ...modos, [tipo.id]: e.target.value as Modo })}
                  className="input"
                >
                  {Object.entries(ETIQUETA_MODO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  name={`valor_${tipo.id}`}
                  inputMode="decimal"
                  disabled={!conValor}
                  required={modo === "horas"}
                  defaultValue={t?.celdas[tipo.id]?.valor ?? ""}
                  placeholder={modo === "horas" ? "Horas" : modo === "fijo" ? "Importe $" : ""}
                  className="input disabled:bg-slate-50"
                />
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-slate-400">Horas admite decimales (ej. 1,5). Valor fijo en pesos sin IVA; se puede dejar vacío hasta tenerlo.</p>
      </div>
    </>
  );
}

function CamposTarifa({ t }: { t: Tarifa }) {
  return (
    <>
      <Field label="Visita a empresa: primera hora ($ sin IVA)">
        <input name="visita_primera" inputMode="decimal" defaultValue={t.visita_primera} required className="input" />
      </Field>
      <Field label="Visita a empresa: horas restantes ($ por hora, sin IVA)">
        <input name="visita_restantes" inputMode="decimal" defaultValue={t.visita_restantes} required className="input" />
      </Field>
      <Field label="Solución remota: valor hora ($ sin IVA)">
        <input name="remota_hora" inputMode="decimal" defaultValue={t.remota_hora} required className="input" />
      </Field>
    </>
  );
}

export function Cotizador({ tarifas, tipos, tareas }: { tarifas: Tarifa[]; tipos: TipoSoporte[]; tareas: TareaCotizable[] }) {
  const [tareaId, setTareaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("remota");
  const [horas, setHoras] = useState("");

  const tarea = tareas.find((t) => String(t.id) === tareaId);
  const tipo = tipos.find((t) => String(t.id) === tipoId);
  const tarifa = tipo ? tarifas.find((t) => t.id === tipo.tarifa_id) : undefined;
  const celda = tarea && tipo ? tarea.celdas[tipo.id] : undefined;

  /** Al cambiar tarea o soporte, se precargan las horas de la tabla. */
  const elegir = (nuevaTarea: string, nuevoTipo: string) => {
    setTareaId(nuevaTarea);
    setTipoId(nuevoTipo);
    const t = tareas.find((x) => String(x.id) === nuevaTarea);
    const c = t?.celdas[Number(nuevoTipo)];
    if (c?.modo === "horas") setHoras(String(c.valor).replace(".", ","));
    else if (t) setHoras("");
  };

  const pideHoras = !tarea || celda?.modo === "horas" || celda?.modo === "a_cotizar";
  const h = Number(horas.replace(",", "."));

  let resultado: { neto: number; detalle: string } | null = null;
  let aviso: string | null = null;
  if (tarea && tipo && celda?.modo === "no_aplica") {
    aviso = `"${tarea.nombre}" no se cotiza para soporte ${tipo.nombre} (en la tabla figura –).`;
  } else if (tarea && tipo && celda?.modo === "fijo") {
    if (celda.valor === null) aviso = `"${tarea.nombre}" tiene valor fijo, pero todavía no está cargado. Editá la tarea para completarlo.`;
    else resultado = { neto: celda.valor, detalle: "Valor fijo" };
  } else if (tarea && tipo && !celda) {
    aviso = `Falta definir "${tarea.nombre}" para soporte ${tipo.nombre}. Editá la tarea.`;
  } else if (tarifa && h > 0) {
    resultado = calcular(h, tarifa, modalidad);
  }

  const neto = resultado ? Math.round(resultado.neto * 100) / 100 : 0;
  const iva = Math.round(neto * IVA * 100) / 100;
  const textoCotizacion =
    resultado && tipo
      ? [
          `Cotización${tarea ? `: ${tarea.nombre}` : ""} — soporte ${tipo.nombre}` +
            (resultado.detalle === "Valor fijo" ? "" : `, ${modalidad === "remota" ? "solución remota" : "visita a empresa"}`),
          `${resultado.detalle} = ${formatPesos(neto)} + IVA`,
          `IVA ${IVA * 100}%: ${formatPesos(iva)} · Total con IVA: ${formatPesos(neto + iva)}`,
        ].join("\n")
      : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-pagina">Cotizador de tareas adicionales</h1>
        <p className="text-sm text-slate-500">Valores sin IVA. Elegí la tarea, el soporte contratado y si es remota o con visita.</p>
      </div>

      <section className="card grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Tarea">
            <select value={tareaId} onChange={(e) => elegir(e.target.value, tipoId)} className="input">
              <option value="">— Otra / ingresar horas a mano —</option>
              {tareas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Soporte contratado">
              <select value={tipoId} onChange={(e) => elegir(tareaId, e.target.value)} className="input">
                <option value="">Elegí…</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad de horas">
              <input
                inputMode="decimal"
                value={pideHoras ? horas : ""}
                disabled={!pideHoras}
                onChange={(e) => setHoras(e.target.value)}
                placeholder={celda?.modo === "a_cotizar" ? "Horas estimadas" : "Ej: 4"}
                className="input disabled:bg-slate-50"
              />
            </Field>
          </div>
          <div>
            <span className="label">Modalidad</span>
            <div className="inline-flex rounded-md border border-slate-300 p-0.5">
              {(
                [
                  ["remota", "Solución remota"],
                  ["visita", "Visita a empresa"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setModalidad(v)}
                  className={`rounded px-3 py-1 text-sm ${modalidad === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {celda?.modo === "a_cotizar" && (
            <p className="text-sm text-amber-700">Esta tarea es a cotizar: ingresá las horas estimadas.</p>
          )}
        </div>

        <div className="flex flex-col justify-center rounded-lg bg-slate-50 p-4">
          {resultado ? (
            <>
              <div className="text-sm text-slate-600">
                {resultado.detalle}
                {tarifa && resultado.detalle !== "Valor fijo" && <span className="text-slate-400"> · tarifa {tarifa.nombre.toLowerCase()}</span>}
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
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
            <p className={`text-sm ${aviso ? "text-amber-800" : "text-slate-500"}`}>
              {aviso ?? "Completá el soporte contratado y las horas para ver el total."}
            </p>
          )}
        </div>
      </section>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="titulo">Tareas cotizables · horas según el soporte</h2>
          <FormDialog trigger="+ Tarea" title="Nueva tarea cotizable" action={crearTarea} wide>
            <CamposTarea tipos={tipos} />
          </FormDialog>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tarea / tipo de soporte</th>
              {tipos.map((t) => (
                <th key={t.id} className="text-center">
                  {t.nombre}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr key={t.id} className={String(t.id) === tareaId ? "bg-blue-50/60" : ""}>
                <td>
                  <button
                    type="button"
                    className="text-left font-medium hover:text-blue-700"
                    onClick={() => {
                      elegir(String(t.id), tipoId);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {t.nombre}
                  </button>
                  {t.descripcion && <div className="text-xs text-slate-500">{t.descripcion}</div>}
                </td>
                {tipos.map((tipo) => {
                  const c = t.celdas[tipo.id];
                  return (
                    <td
                      key={tipo.id}
                      className={`text-center whitespace-nowrap tabular-nums ${
                        c?.modo === "horas" ? "" : c?.modo === "no_aplica" ? "text-slate-400" : "text-xs text-slate-600"
                      }`}
                    >
                      {textoCelda(c)}
                    </td>
                  );
                })}
                <td className="text-right whitespace-nowrap">
                  <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar tarea" action={editarTarea.bind(null, t.id)} wide>
                    <CamposTarea t={t} tipos={tipos} />
                  </FormDialog>
                  <DeleteButton action={borrarTarea.bind(null, t.id)} confirmText={`¿Borrar la tarea "${t.nombre}"?`} />
                </td>
              </tr>
            ))}
            {tareas.length === 0 && (
              <tr>
                <td colSpan={tipos.length + 2} className="text-center text-slate-500">
                  No hay tareas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {tarifas.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="titulo">Tarifa {t.nombre.toLowerCase()}</h2>
                <p className="text-xs text-slate-500">
                  {tipos
                    .filter((x) => x.tarifa_id === t.id)
                    .map((x) => x.nombre)
                    .join(" · ")}
                </p>
              </div>
              <FormDialog trigger="Editar" triggerClassName="btn-link" title={`Tarifa ${t.nombre.toLowerCase()}`} action={editarTarifa.bind(null, t.id)}>
                <CamposTarifa t={t} />
              </FormDialog>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-600">Visita a empresa · primera hora</td>
                  <td className="py-1 text-right tabular-nums">{formatPesos(t.visita_primera)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Visita a empresa · horas restantes</td>
                  <td className="py-1 text-right tabular-nums">{formatPesos(t.visita_restantes)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Solución remota · valor hora</td>
                  <td className="py-1 text-right tabular-nums">{formatPesos(t.remota_hora)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-400">Valores sin IVA · actualizado {t.actualizado}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
