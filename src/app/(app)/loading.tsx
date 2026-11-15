/**
 * Esqueleto que se ve mientras carga cualquier pestaña.
 * La barra lateral ya está pintada por el layout: acá solo va el contenido.
 */
export default function Cargando() {
  return (
    <div className="max-w-5xl space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>

      <div className="h-7 w-56 animate-pulse rounded-md bg-slate-200" />

      <div className="card space-y-3 p-4" aria-hidden>
        {[92, 78, 85, 60].map((ancho, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${ancho}%` }} />
        ))}
      </div>

      <div className="card space-y-3 p-4" aria-hidden>
        {[70, 88, 55].map((ancho, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${ancho}%` }} />
        ))}
      </div>
    </div>
  );
}
