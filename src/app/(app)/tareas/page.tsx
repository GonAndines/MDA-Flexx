import { query } from "@/lib/db";
import { Tareas, type Tarea } from "./Tareas";

export const metadata = { title: "Tareas adicionales · Mesa de ayuda" };

export default async function TareasPage() {
  const tareas = await query<Tarea>(
    `select id, nombre, descripcion, unidad, valor::float8 as valor, to_char(actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
     from tareas order by nombre`,
  );
  return <Tareas tareas={tareas} />;
}
