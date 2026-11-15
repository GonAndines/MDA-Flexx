"use client";

// Errores fuera de la zona con sesión (por ejemplo, el login). Mismo patrón que (app)/error.tsx:
// en Next 16 el prop es `retry`, que vuelve a pedir y renderizar.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16" role="alert">
      <h1 className="titulo-pagina">Algo falló</h1>
      <p className="text-sm text-slate-600">No se pudo cargar la pantalla. Probá de nuevo en unos segundos.</p>
      {error.digest && (
        <p className="rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">Código del error: {error.digest}</p>
      )}
      <button type="button" className="btn-primary" onClick={() => retry()}>
        Reintentar
      </button>
    </div>
  );
}
