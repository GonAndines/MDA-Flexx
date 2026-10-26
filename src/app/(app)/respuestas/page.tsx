import { query } from "@/lib/db";
import { Respuestas, type Respuesta } from "./Respuestas";

export const metadata = { title: "Respuestas rápidas · Mesa de ayuda" };

export default async function RespuestasPage() {
  const respuestas = await query<Respuesta>(
    "select id, titulo, categoria, texto from respuestas order by categoria, titulo",
  );
  return <Respuestas respuestas={respuestas} />;
}
