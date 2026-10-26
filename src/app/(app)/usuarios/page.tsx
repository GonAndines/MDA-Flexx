import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { Usuarios, type UsuarioFila } from "./Usuarios";

export const metadata = { title: "Usuarios · Mesa de ayuda" };

export default async function UsuariosPage() {
  const yo = await requireAdmin();
  const usuarios = await query<UsuarioFila>(
    `select u.id, u.nombre, u.email, u.rol, u.activo,
            (select count(*)::int from llamadas l where l.usuario_id = u.id) as llamadas
     from usuarios u order by u.activo desc, u.nombre`,
  );
  return <Usuarios usuarios={usuarios} yoId={yo.id} />;
}
