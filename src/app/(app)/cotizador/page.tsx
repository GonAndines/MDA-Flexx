import { query } from "@/lib/db";
import { Cotizador, type TareaCotizable, type TipoSoporte } from "./Cotizador";

export const metadata = { title: "Cotizador · Mesa de ayuda" };

export default async function CotizadorPage() {
  const [tareas, tipos] = await Promise.all([
    query<TareaCotizable>("select id, nombre, descripcion, horas::float8 as horas from tareas_cotizables order by nombre"),
    query<TipoSoporte>(
      `select id, nombre, valor_hora::float8 as valor_hora, to_char(actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
       from tipos_soporte order by orden, nombre`,
    ),
  ]);
  return <Cotizador tareas={tareas} tipos={tipos} />;
}
