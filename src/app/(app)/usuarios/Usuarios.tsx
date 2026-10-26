"use client";

import { Field, FormDialog } from "@/components/FormDialog";
import { crearUsuario, editarUsuario } from "./actions";

export type UsuarioFila = { id: number; nombre: string; email: string; rol: "admin" | "operador"; activo: boolean; casos: number };

function Campos({ u }: { u?: UsuarioFila }) {
  return (
    <>
      <Field label="Nombre">
        <input name="nombre" defaultValue={u?.nombre} required className="input" />
      </Field>
      <Field label="Email (usuario de ingreso)">
        <input name="email" type="email" defaultValue={u?.email} required className="input" />
      </Field>
      <Field label={u ? "Nueva contraseña (vacío = no cambiar)" : "Contraseña (mínimo 8 caracteres)"}>
        <input name="password" type="password" autoComplete="new-password" required={!u} minLength={8} className="input" />
      </Field>
      <Field label="Rol">
        <select name="rol" defaultValue={u?.rol ?? "operador"} className="input">
          <option value="operador">Operador</option>
          <option value="admin">Administrador (además gestiona usuarios)</option>
        </select>
      </Field>
      {u && (
        <label className="flex items-center gap-2 text-sm">
          <input name="activo" type="checkbox" defaultChecked={u.activo} /> Usuario activo (puede ingresar)
        </label>
      )}
    </>
  );
}

export function Usuarios({ usuarios, yoId }: { usuarios: UsuarioFila[]; yoId: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-slate-500">Los usuarios no se borran: se desactivan para conservar quién registró cada caso.</p>
        </div>
        <FormDialog trigger="+ Nuevo usuario" triggerClassName="btn-primary" title="Nuevo usuario" action={crearUsuario}>
          <Campos />
        </FormDialog>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th className="text-right">Casos registrados</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className={u.activo ? "" : "opacity-50"}>
                <td className="font-medium">
                  {u.nombre}
                  {u.id === yoId && <span className="ml-1 text-xs text-slate-400">(vos)</span>}
                  {!u.activo && <span className="ml-1 text-xs text-slate-500">· inactivo</span>}
                </td>
                <td>{u.email}</td>
                <td>{u.rol === "admin" ? "Administrador" : "Operador"}</td>
                <td className="text-right tabular-nums">{u.casos}</td>
                <td className="text-right">
                  <FormDialog trigger="Editar" triggerClassName="btn-link" title="Editar usuario" action={editarUsuario.bind(null, u.id)}>
                    <Campos u={u} />
                  </FormDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
