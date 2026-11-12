import { getUsuario } from "@/lib/auth";
import { queryOne } from "@/lib/db";

/** Imagen de un informe. Solo para usuarios con sesión: son capturas internas del sistema. */
export async function GET(_req: Request, ctx: RouteContext<"/imagenes/[id]">) {
  if (!(await getUsuario())) return new Response("No autorizado", { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("No encontrada", { status: 404 });
  const img = await queryOne<{ tipo: string; datos: string }>("select tipo, datos from imagenes where id = $1", [id]);
  if (!img) return new Response("No encontrada", { status: 404 });
  return new Response(Buffer.from(img.datos, "base64"), {
    headers: { "Content-Type": img.tipo, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
