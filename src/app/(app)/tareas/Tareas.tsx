"use client";

import { DeleteButton } from "@/components/buttons";
import { Field, FormDialog } from "@/components/FormDialog";
import { formatPesos } from "@/lib/format";
import { ajustarValores, borrarTarea, crearTarea, editarTarea } from "./actions";

export type Tarea = { id: number; nombre: string; descripcion: string; unidad: string; valor: number; actualizado: string };

function Campos({ t }: { t?: Tarea }) {
  return (
    <>
      <Field label="Nombre">
        <input name="nombre" defaultValue={t?.nombre} required className="input" />
      </Field>
      <Field label="Descripción">
        <textarea name="descripcion" defaultValue={t?.descripcion} rows={2} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unidad (hora, visita, puesto…)">
          <input name="unidad" defaultValue={t?.unidad ?? "hora"} list="unidades" className="input" />
          <datalist id="unidades">
            <option value="hora" />
            <option value="visita" />
            <option value="puesto" />
            <option value="unidad" />
          </datalist>
        </Field>
        <Field label="Valor ($)">
          <input name="valor" type="number" min="0" step="0.01" defaultValue={t?.valor} required className="input" />
        </Field>
      </div>
    </>
  );
}

export function Tareas({ tareas }: { tareas: Tarea[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Valores de tareas adicionales</h1>
          <p className="text-sm text-slate-500">Tareas que se cobran aparte del plan de soporte. Valores finales en pesos.</p>
        </div>
        <div className="flex gap-2">
          <FormDialog trigger="Ajustar valores %" title="Ajustar todos los valores" action={ajustarValores} submitLabel="Aplicar">
            <p className="text-sm text-slate-600">Aplica el porcentaje a todas las tareas (usá un número negativo para bajar).</p>
            <Field label="Porcentaje">
              <input name="porcentaje" type="number" step="0.01" required className="input" placeholder="Ej: 8,5" />
            </Field>
          </FormDialog>
          <FormDialog trigger="+ Nueva tarea" triggerClassName="btn-primary" title="Nueva tarea adicional" action={crearTarea}>
            <Campos />
          </FormDialog>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Unidad</th>
              <th className="text-right">Valor</th>
              <th>Actualizado</th>
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
                <td>{t.unidad}</td>
                <td className="text-right font-medium whitespace-nowrap tabular-nums">{formatPesos(t.valor)}</td>
                <td className="text-slate-500">{t.actualizado}</td>
                <td className="text-right whitespace-nowrap">
                  <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar tarea" action={editarTarea.bind(null, t.id)}>
                    <Campos t={t} />
                  </FormDialog>
                  <DeleteButton action={borrarTarea.bind(null, t.id)} confirmText={`¿Borrar la tarea "${t.nombre}"?`} />
                </td>
              </tr>
            ))}
            {tareas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-500">
                  No hay tareas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
