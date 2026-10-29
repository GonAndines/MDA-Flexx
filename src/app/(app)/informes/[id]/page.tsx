import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/buttons";
import { FormDialog } from "@/components/FormDialog";
import { Markdown } from "@/components/Markdown";
import { query, queryOne } from "@/lib/db";
import { borrarInforme, editarInforme } from "../actions";
import { CATEGORIAS_SUGERIDAS, SELECT_INFORMES, urlCategoria } from "@/lib/informes";
import { CamposInforme, type Informe } from "../Informes";

export default async function InformePage({ params }: PageProps<"/informes/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [informe, cats] = await Promise.all([
    queryOne<Informe>(`${SELECT_INFORMES} where i.id = $1`, [id]),
    query<{ categoria: string }>("select distinct categoria from informes"),
  ]);
  if (!informe) notFound();
  const categorias = [...new Set([...CATEGORIAS_SUGERIDAS, ...cats.map((c) => c.categoria)])].sort();

  return (
    <div className="max-w-3xl space-y-4">
      <Link href={urlCategoria(informe.categoria)} className="btn-link -ml-2">
        ‹ {informe.categoria}
      </Link>
      <article className="card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{informe.categoria}</span>
            <h1 className="titulo-pagina mt-2">{informe.titulo}</h1>
            <p className="mt-1 text-xs text-slate-400">
              Actualizado {informe.actualizado}
              {informe.autor ? ` por ${informe.autor}` : ""}
            </p>
          </div>
          <div className="flex">
            <FormDialog trigger="Editar" triggerClassName="btn" title="Editar informe" action={editarInforme.bind(null, informe.id)} wide>
              <CamposInforme i={informe} categorias={categorias} />
            </FormDialog>
            <DeleteButton action={borrarInforme.bind(null, informe.id)} confirmText={`¿Borrar el informe "${informe.titulo}"?`} />
          </div>
        </div>
        {informe.contenido ? <Markdown>{informe.contenido}</Markdown> : <p className="text-sm text-slate-400">Sin contenido.</p>}
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps<"/informes/[id]">) {
  const id = Number((await params).id);
  const i = Number.isInteger(id) ? await queryOne<{ titulo: string }>("select titulo from informes where id = $1", [id]) : null;
  return { title: `${i?.titulo ?? "Informe"} · Mesa de ayuda` };
}
