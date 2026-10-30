import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getUsuario } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Ingresar · Mesa de ayuda" };

export default async function LoginPage() {
  if (await getUsuario()) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6">
        <Logo ancho={150} className="mb-5" />
        <h1 className="titulo-pagina mb-1">Mesa de ayuda</h1>
        <p className="mb-6 text-sm text-slate-500">Ingresá con tu usuario.</p>
        <LoginForm />
      </div>
    </main>
  );
}
