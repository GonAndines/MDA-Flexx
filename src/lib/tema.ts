import { cookies } from "next/headers";
import type { Tema } from "@/components/Tema";

/** Tema elegido en este navegador (por defecto, claro). */
export async function leerTema(): Promise<Tema> {
  return (await cookies()).get("tema")?.value === "oscuro" ? "oscuro" : "claro";
}
