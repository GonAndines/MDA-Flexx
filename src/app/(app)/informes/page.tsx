import { query } from "@/lib/db";
import { CATEGORIAS_SUGERIDAS, SELECT_INFORMES, normalizar } from "@/lib/informes";
import { Informes, type Informe, type ResumenCategoria } from "./Informes";

export const metadata = { title: "Informes · Mesa de ayuda" };

const SIN_ACENTOS = "translate(lower(i.titulo || ' ' || i.categoria || ' ' || i.contenido), 'áéíóúüñ', 'aeiouun')";

export default async function InformesPage({ searchParams }: PageProps<"/informes">) {
  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  const q = uno(sp.q);

  const resumen = await query<ResumenCategoria>(
    `select categoria, count(*)::int as cantidad, to_char(max(actualizado) - interval '3 hours', 'DD/MM/YYYY') as actualizado
     from informes group by categoria order by categoria`,
  );
  const categorias = [...new Set([...CATEGORIAS_SUGERIDAS, ...resumen.map((r) => r.categoria)])].sort();

  // Sin categoría ni búsqueda se abre la primera categoría; con búsqueda y sin categoría, se busca en todas.
  const categoria = uno(sp.categoria) || (q ? "" : (resumen[0]?.categoria ?? ""));
  if (!categoria && !q) return <Informes resumen={resumen} informes={[]} categoria="" q="" categorias={categorias} />;

  const condiciones: string[] = [];
  const params: string[] = [];
  if (categoria) {
    params.push(categoria);
    condiciones.push(`i.categoria = $${params.length}`);
  }
  for (const palabra of normalizar(q).split(/\s+/).filter(Boolean)) {
    params.push(`%${palabra.replace(/[\\%_]/g, "\\$&")}%`);
    condiciones.push(`${SIN_ACENTOS} like $${params.length}`);
  }
  const informes = await query<Informe>(`${SELECT_INFORMES} where ${condiciones.join(" and ")} order by i.actualizado desc, i.id desc`, params);

  return <Informes resumen={resumen} informes={informes} categoria={categoria} q={q} categorias={categorias} />;
}
