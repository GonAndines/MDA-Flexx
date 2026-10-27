import { query } from "./db";

/**
 * Todo usuario activo es agente de los sábados. Para los que todavía no tienen agente:
 * 1. Si su primer nombre coincide (sin distinguir mayúsculas) con un único agente sin usuario
 *    —los nombres que vinieron del cronograma en Excel— se vincula a ese agente y conserva su historial.
 * 2. Si no, se le crea un agente con su nombre.
 * Es idempotente y barato: se llama antes de mostrar el cronograma.
 */
export async function sincronizarAgentes() {
  await query(
    `update agentes a set usuario_id = u.id
     from usuarios u
     where a.usuario_id is null and u.activo
       and not exists (select 1 from agentes x where x.usuario_id = u.id)
       and lower(a.nombre) = lower(split_part(trim(u.nombre), ' ', 1))
       and (select count(*) from agentes y where y.usuario_id is null and lower(y.nombre) = lower(a.nombre)) = 1
       and (select count(*) from usuarios v where v.activo and lower(split_part(trim(v.nombre), ' ', 1)) = lower(a.nombre)) = 1`,
  );
  await query(
    `insert into agentes (nombre, usuario_id)
     select u.nombre, u.id from usuarios u
     where u.activo and not exists (select 1 from agentes x where x.usuario_id = u.id)
     on conflict (nombre) do nothing`,
  );
}
