import { sincronizarAgentes } from "@/lib/agentes";
import { requireUsuario } from "@/lib/auth";
import { AHORA_AR, query } from "@/lib/db";
import { Sabados, type Agente, type Sabado } from "./Sabados";

export const metadata = { title: "Sábados · Mesa de ayuda" };

export default async function SabadosPage() {
  const usuario = await requireUsuario();
  const esAdmin = usuario.rol === "admin";
  const hoy = `(${AHORA_AR})::date`;
  await sincronizarAgentes();

  const [sabados, agentes, usuarios] = await Promise.all([
    query<Sabado>(
      `select s.id, to_char(s.fecha, 'YYYY-MM-DD') as fecha, s.tanda, s.feriado, s.activa_id, s.pasiva_id,
              a.nombre as activa, p.nombre as pasiva, s.fecha > ${hoy} as futuro, s.fecha >= ${hoy} as vigente
       from sabados s left join agentes a on a.id = s.activa_id left join agentes p on p.id = s.pasiva_id
       order by s.fecha`,
    ),
    query<Agente>(
      `select ag.id, ag.nombre, ag.usuario_id, u.nombre as usuario, ag.activo and coalesce(u.activo, true) as activo
       from agentes ag left join usuarios u on u.id = ag.usuario_id
       order by ag.activo and coalesce(u.activo, true) desc, ag.nombre`,
    ),
    esAdmin ? query<{ id: number; nombre: string }>("select id, nombre from usuarios where activo order by nombre") : [],
  ]);
  const miAgenteId = agentes.find((a) => a.usuario_id === usuario.id && a.activo)?.id ?? null;

  return (
    <div className="max-w-5xl">
      <Sabados sabados={sabados} agentes={agentes} usuarios={usuarios} miAgenteId={miAgenteId} esAdmin={esAdmin} />
    </div>
  );
}
