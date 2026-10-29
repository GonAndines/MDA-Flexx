"use client";

import { CopyButton, DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { borrarContacto, crearContacto, editarContacto } from "./actions";

export type Contacto = { id: number; area: string; tipo: "whatsapp" | "telefono" | "email" | "otro"; valor: string; detalle: string };

const TIPOS = { whatsapp: "WhatsApp", telefono: "Teléfono", email: "Email", otro: "Otro" } as const;

function Campos({ c, areas }: { c?: Contacto; areas: string[] }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Área">
          <input name="area" defaultValue={c?.area} required list="areas-contacto" className="input" placeholder="Ej: Soporte" />
          <datalist id="areas-contacto">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
        <Field label="Tipo">
          <select name="tipo" defaultValue={c?.tipo ?? "whatsapp"} className="input">
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Número o email (tal como se le pasa al cliente)">
        <input name="valor" defaultValue={c?.valor} required className="input" placeholder="Ej: +54 9 351 555-1234" />
      </Field>
      <Field label="Detalle (opcional)">
        <input name="detalle" defaultValue={c?.detalle} className="input" placeholder="Ej: lunes a viernes de 9 a 18" />
      </Field>
    </>
  );
}

export function Contactos({ contactos }: { contactos: Contacto[] }) {
  const areas = [...new Set(contactos.map((c) => c.area))];

  return (
    <section className="card h-fit p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="titulo">Contactos</h2>
        <FormDialog trigger="+ Contacto" triggerClassName="btn-link" title="Nuevo contacto" action={crearContacto}>
          <Campos areas={areas} />
        </FormDialog>
      </div>
      {contactos.length === 0 && (
        <p className="text-sm text-slate-500">Agregá los WhatsApp, teléfonos o mails de Soporte, Administración y otras áreas.</p>
      )}
      <div className="space-y-4">
        {areas.map((area) => (
          <div key={area}>
            <h3 className="rotulo mb-1">{area}</h3>
            <ul className="space-y-2">
              {contactos
                .filter((c) => c.area === area)
                .map((c) => (
                    <li key={c.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            c.tipo === "whatsapp" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {TIPOS[c.tipo]}
                        </span>
                        <span className="min-w-0 font-mono font-bold text-slate-900 select-all">{c.valor}</span>
                      </div>
                      {c.detalle && <div className="mt-0.5 text-xs text-slate-500">{c.detalle}</div>}
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <CopyButton text={c.valor} />
                        <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar contacto" action={editarContacto.bind(null, c.id)}>
                          <Campos c={c} areas={areas} />
                        </FormDialog>
                        <DeleteButton action={borrarContacto.bind(null, c.id)} confirmText={`¿Borrar el contacto ${c.valor} (${c.area})?`} />
                      </div>
                    </li>
                  ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
