/** Gráfico de barras de una sola serie, sin dependencias. Cada barra muestra su detalle al pasar el mouse o al enfocarla. */

export type Barra = { etiqueta: string; valor: number | null; detalle?: string };

const numero = (n: number) => n.toLocaleString("es-AR");

/** Marca "redonda" para el eje: 1, 2, 5 o 10 × potencia de 10, por encima del máximo. */
function topeEje(max: number) {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 5, 10].map((m) => m * p).find((t) => t >= max)!;
}

export function GraficoBarras({ barras, resaltarMaximo = true, vacio }: { barras: Barra[]; resaltarMaximo?: boolean; vacio: string }) {
  const valores = barras.map((b) => b.valor ?? 0);
  const max = Math.max(...valores, 0);
  if (max === 0 && barras.every((b) => b.valor === null)) return <p className="py-10 text-center text-sm text-slate-500">{vacio}</p>;
  const tope = topeEje(max);
  const marcas = [tope, tope / 2, 0];
  // Se rotulan todos los que empatan en el máximo.
  const esMax = (i: number) => resaltarMaximo && max > 0 && valores[i] === max;

  return (
    <div className="flex gap-2">
      {/* Eje vertical: tres marcas recesivas. */}
      <div className="flex h-52 flex-col justify-between pt-5 pb-6 text-right text-xs text-slate-500 tabular-nums" aria-hidden>
        {marcas.map((m) => (
          <span key={m} className="-translate-y-1/2 leading-none">
            {numero(m)}
          </span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-5 bottom-6 flex flex-col justify-between" aria-hidden>
          {marcas.map((m) => (
            <div key={m} className={`border-t ${m === 0 ? "border-slate-400" : "border-dashed border-slate-200"}`} />
          ))}
        </div>
        <ul className="relative flex h-52 items-stretch gap-1.5 pt-5 sm:gap-2">
          {barras.map((b, i) => {
            const alto = ((b.valor ?? 0) / tope) * 100;
            const texto = `${b.etiqueta}: ${b.valor === null ? "sin datos" : numero(b.valor)}${b.detalle ? ` (${b.detalle})` : ""}`;
            return (
              <li key={b.etiqueta} className="group relative flex min-w-0 flex-1 flex-col">
                <div tabIndex={0} aria-label={texto} className="relative flex flex-1 flex-col justify-end rounded-t-[4px] outline-offset-2 hover:bg-slate-100/60 focus-visible:bg-slate-100/60">
                  {(b.valor ?? 0) > 0 && (
                    <div className="barra relative rounded-t-[4px]" style={{ height: `${alto}%` }}>
                      {esMax(i) && (
                        <span className="absolute inset-x-0 bottom-full mb-0.5 text-center text-xs font-bold text-slate-900 tabular-nums">{numero(max)}</span>
                      )}
                    </div>
                  )}
                  {/* Detalle al pasar el mouse o enfocar con el teclado. */}
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border border-slate-200 bg-surface px-2 py-1 text-xs whitespace-nowrap text-slate-800 shadow-md group-hover:block group-focus-within:block">
                    {texto}
                  </span>
                </div>
                <span className="h-6 truncate pt-1 text-center text-xs text-slate-600">{b.etiqueta}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
