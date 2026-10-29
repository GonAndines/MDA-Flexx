"use client";

import { useState } from "react";

export type Tema = "claro" | "oscuro";

/** Botón para alternar entre tema claro y oscuro. La elección queda en la cookie "tema" de este navegador. */
export function BotonTema({ inicial, className = "btn-link" }: { inicial: Tema; className?: string }) {
  const [tema, setTema] = useState(inicial);
  const otro: Tema = tema === "oscuro" ? "claro" : "oscuro";
  return (
    <button
      type="button"
      className={className}
      title={`Cambiar a modo ${otro}`}
      aria-label={`Cambiar a modo ${otro}`}
      onClick={() => {
        document.documentElement.dataset.theme = otro;
        document.cookie = `tema=${otro}; path=/; max-age=31536000; samesite=lax`;
        setTema(otro);
      }}
    >
      {tema === "oscuro" ? "☀" : "☾"}
      <span className="hidden sm:inline"> Modo {otro}</span>
    </button>
  );
}
