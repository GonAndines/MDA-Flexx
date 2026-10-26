import { query } from "@/lib/db";
import { Cotizador, type Celda, type TareaCotizable, type Tarifa, type TipoSoporte } from "./Cotizador";

export const metadata = { title: "Cotizador · Mesa de ayuda" };

export default async function CotizadorPage() {
  const [tarifas, tipos, tareas, celdas] = await Promise.all([
    query<Tarifa>(
      `select id, nombre, visita_primera::float8 as visita_primera, visita_restantes::float8 as visita_restantes,
              remota_hora::float8 as remota_hora, to_char(actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
       from tarifas order by orden, nombre`,
    ),
    query<TipoSoporte>("select id, nombre, tarifa_id from tipos_soporte order by orden, nombre"),
    query<Omit<TareaCotizable, "celdas">>("select id, nombre, descripcion from tareas_cotizables order by orden, id"),
    query<Celda & { tarea_id: number }>("select tarea_id, tipo_id, modo, valor::float8 as valor from tarea_soporte"),
  ]);

  const conCeldas: TareaCotizable[] = tareas.map((t) => ({
    ...t,
    celdas: Object.fromEntries(
      celdas.filter((c) => c.tarea_id === t.id).map((c) => [c.tipo_id, { tipo_id: c.tipo_id, modo: c.modo, valor: c.valor }]),
    ),
  }));

  return <Cotizador tarifas={tarifas} tipos={tipos} tareas={conCeldas} />;
}
