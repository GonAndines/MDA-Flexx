export const CATEGORIAS_SUGERIDAS = ["Notas de release", "Uso del sistema", "Procedimientos", "General"];

/** Minúsculas y sin acentos, para buscar. */
export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Enlace al listado de una categoría. */
export const urlCategoria = (categoria: string) => `/informes?categoria=${encodeURIComponent(categoria)}`;

export const SELECT_INFORMES = `select i.id, i.titulo, i.categoria, i.contenido, u.nombre as autor,
         to_char(i.actualizado - interval '3 hours', 'DD/MM/YYYY') as actualizado
  from informes i left join usuarios u on u.id = i.usuario_id`;
