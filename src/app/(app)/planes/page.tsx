import { AHORA_AR, query } from "@/lib/db";
import { Planes, type Empresa, type Plan } from "./Planes";

export const metadata = { title: "Planes y empresas · Mesa de ayuda" };

export default async function PlanesPage() {
  const [planes, empresas] = await Promise.all([
    query<Plan>(
      `select p.id, p.nombre, p.descripcion, p.incluye, p.horario, p.tiempo_respuesta, p.llamadas_mes,
              p.abono_mensual::float8 as abono_mensual,
              (select count(*)::int from empresas e where e.plan_id = p.id and e.activa) as empresas
       from planes p order by p.orden, p.nombre`,
    ),
    query<Empresa>(
      `select e.id, e.nombre, e.cuit, e.contacto, e.telefono, e.email, e.plan_id, e.notas, e.activa,
              (select count(*)::int from llamadas l
                where l.empresa_id = e.id and l.fecha >= date_trunc('month', ${AHORA_AR})) as llamadas_mes
       from empresas e order by e.nombre`,
    ),
  ]);
  return <Planes planes={planes} empresas={empresas} />;
}
