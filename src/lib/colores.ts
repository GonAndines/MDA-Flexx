/**
 * Colores de las personas en el calendario de novedades. Cada uno tiene un tinte de fondo y un texto,
 * en versión clara y oscura, para que se lean bien en los dos temas.
 */
export const COLORES = {
  verde: { nombre: "Verde", claro: ["#d3ecd9", "#1d5a32"], oscuro: ["#1e3d29", "#9fdcb3"] },
  amarillo: { nombre: "Amarillo", claro: ["#f6e7a8", "#6b5208"], oscuro: ["#4a3d10", "#f0d77a"] },
  azul: { nombre: "Azul", claro: ["#d4e3f7", "#1d4a80"], oscuro: ["#1d3352", "#a7c8f0"] },
  coral: { nombre: "Coral", claro: ["#f6d6d1", "#8a2f26"], oscuro: ["#4d2421", "#f3b0a8"] },
  violeta: { nombre: "Violeta", claro: ["#e3dbf4", "#4d3388"], oscuro: ["#33294f", "#c9b8ef"] },
  cian: { nombre: "Cian", claro: ["#cdeef0", "#145e66"], oscuro: ["#163f43", "#93dbe1"] },
  naranja: { nombre: "Naranja", claro: ["#f8dfc4", "#8a4510"], oscuro: ["#4b2e15", "#f5bf8a"] },
  rosa: { nombre: "Rosa", claro: ["#f5d7e6", "#86275a"], oscuro: ["#4a2238", "#efb1d0"] },
  oliva: { nombre: "Oliva", claro: ["#e2e8c6", "#4e5a17"], oscuro: ["#343a17", "#cfd99a"] },
  gris: { nombre: "Gris", claro: ["#e1e5e3", "#3a4643"], oscuro: ["#2c3537", "#c3cdc9"] },
} as const;

export type Color = keyof typeof COLORES;

const CLAVES = Object.keys(COLORES) as Color[];
/** Colores que se reparten automáticamente (el gris queda para las novedades de todo el equipo). */
const AUTOMATICOS = CLAVES.filter((c) => c !== "gris");

export const esColor = (c: unknown): c is Color => typeof c === "string" && c in COLORES;

/** Color de un usuario: el que eligió el administrador o, si no eligió, uno fijo según su id. */
export function colorDe(id: number | null, elegido: string | null | undefined): Color {
  if (esColor(elegido)) return elegido;
  return id === null ? "gris" : AUTOMATICOS[(id - 1) % AUTOMATICOS.length];
}

/** Variables CSS para la clase .color-persona (globals.css), que elige el par claro u oscuro según el tema. */
export function estiloColor(c: Color) {
  const { claro, oscuro } = COLORES[c];
  return { "--p-bg": claro[0], "--p-fg": claro[1], "--p-bg-o": oscuro[0], "--p-fg-o": oscuro[1] } as React.CSSProperties;
}
