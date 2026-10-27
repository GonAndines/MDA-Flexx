"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CopyButton, DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { borrarClave, crearClave, editarClave } from "./actions";

export type Clave = { id: number; nombre: string; valor: string };

const RECORDAR = "mda.usuarioFlexxus";

function usuarioGuardado() {
  try {
    return localStorage.getItem(RECORDAR) || "ADMIN";
  } catch {
    return "ADMIN";
  }
}

const sinSuscripcion = () => () => {};

/** Año, mes y día de hoy en Argentina. */
function hoyArgentina() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date())
      .map((x) => [x.type, Number(x.value)]),
  );
  return { anio: p.year, mes: p.month, dia: p.day };
}

/** Vieja: año + mes + día (sumados), "!" y el usuario. Ej. 27/10/2026 → 2063!ADMIN */
const passVieja = ({ anio, mes, dia }: ReturnType<typeof hoyArgentina>, usuario: string) => `${anio + mes + dia}!${usuario}`;
/** Nueva: año, "*", mes + día (sumados), "*" y el usuario. Ej. 27/10/2026 → 2026*37*ADMIN */
const passNueva = ({ anio, mes, dia }: ReturnType<typeof hoyArgentina>, usuario: string) => `${anio}*${mes + dia}*${usuario}`;

function Fila({ nombre, valor, children }: { nombre: string; valor: string; children?: React.ReactNode }) {
  return (
    <li className="text-sm">
      <div className="text-xs text-slate-500">{nombre}</div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <code className="min-w-0 truncate font-mono font-medium text-slate-900 select-all">
          {valor}
        </code>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          <CopyButton text={valor} />
          {children}
        </div>
      </div>
    </li>
  );
}

function Campos({ c }: { c?: Clave }) {
  return (
    <>
      <Field label="Nombre">
        <input name="nombre" defaultValue={c?.nombre} required className="input" placeholder="Ej: Pass Firebird 5" />
      </Field>
      <Field label="Contraseña">
        <input name="valor" defaultValue={c?.valor} required className="input font-mono" autoComplete="off" />
      </Field>
    </>
  );
}

export function Claves({ claves, esAdmin }: { claves: Clave[]; esAdmin: boolean }) {
  // Las contraseñas de Flexxus dependen de la fecha y del usuario guardado en este navegador: se calculan solo en el cliente.
  const enCliente = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [editado, setUsuario] = useState<string | null>(null);
  const usuario = editado ?? (enCliente ? usuarioGuardado() : "");
  const [hoy, setHoy] = useState(hoyArgentina);

  // Recalcula si cambia el día con la página abierta.
  useEffect(() => {
    const t = setInterval(() => setHoy(hoyArgentina()), 60_000);
    return () => clearInterval(t);
  }, []);

  const u = enCliente ? usuario.trim() : "";

  return (
    <section className="card h-fit p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Contraseñas</h2>
        {esAdmin && (
          <FormDialog trigger="+ Contraseña" triggerClassName="btn-link" title="Nueva contraseña" action={crearClave}>
            <Campos />
          </FormDialog>
        )}
      </div>

      <Field label="Usuario de Flexxus">
        <input
          value={usuario}
          onChange={(e) => {
            setUsuario(e.target.value);
            try {
              localStorage.setItem(RECORDAR, e.target.value.trim());
            } catch {}
          }}
          className="input font-mono"
          placeholder="Ej: ADMIN"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <ul className="mt-3 space-y-3">
        {u ? (
          <>
            <Fila nombre="Pass Flexxus vieja" valor={passVieja(hoy, u)} />
            <Fila nombre="Pass Flexxus nueva" valor={passNueva(hoy, u)} />
          </>
        ) : (
          enCliente && <li className="text-sm text-slate-500">Ingresá el usuario para ver las contraseñas de Flexxus.</li>
        )}
        {claves.map((c) => (
          <Fila key={c.id} nombre={c.nombre} valor={c.valor}>
            {esAdmin && (
              <>
                <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar contraseña" action={editarClave.bind(null, c.id)}>
                  <Campos c={c} />
                </FormDialog>
                <DeleteButton action={borrarClave.bind(null, c.id)} confirmText={`¿Borrar "${c.nombre}"?`} />
              </>
            )}
          </Fila>
        ))}
      </ul>
    </section>
  );
}
