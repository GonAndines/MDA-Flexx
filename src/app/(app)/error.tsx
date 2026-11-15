"use client";

import Link from "next/link";

// Límite de errores de las pestañas con sesión. En Next 16 el prop se llama `retry`
// (vuelve a buscar y renderizar); `reset` solo limpia el estado sin volver a pedir datos.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-10" role="alert">
      <h1 className="titulo-pagina">No se pudo cargar esta pantalla</h1>
      <p className="text-sm text-slate-600">
        Puede ser un problema momentáneo de conexión con la base de datos. Probá de nuevo; si sigue pasando, avisale al
        administrador.
      </p>
      {error.digest && (
        <p className="rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">Código del error: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          Reintentar
        </button>
        <Link href="/" className="btn">
          Volver al resumen
        </Link>
      </div>
    </div>
  );
}
