import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Ingresar · Mesa de ayuda" };

export default async function LoginPage() {
  if (await getUsuario()) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold">Mesa de ayuda</h1>
        <p className="mb-6 text-sm text-slate-500">Ingresá con tu usuario.</p>
        <LoginForm />
      </div>
    </main>
  );
}
