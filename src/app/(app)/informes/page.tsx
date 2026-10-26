import { query } from "@/lib/db";
import { SELECT_INFORMES } from "@/lib/informes";
import { Informes, type Informe } from "./Informes";

export const metadata = { title: "Informes · Mesa de ayuda" };

export default async function InformesPage() {
  const informes = await query<Informe>(`${SELECT_INFORMES} order by i.actualizado desc`);
  return <Informes informes={informes} />;
}
