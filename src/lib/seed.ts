import type { Driver } from "./db";

// Datos iniciales. Todo se puede editar o borrar desde la aplicación.

const EMPRESAS_BASICO = [
  "ACEROS LIDER",
  "BATERIAS CECCHETTO",
  "BERNACO",
  "CSACCESORIOS",
  "DIAGNOSTIKA",
  "DIDO DISTRIBUIDORA DORREGO",
  "FRODO S.A.",
  "FRONTERA CENTER",
  "GRUPO JALED",
  "LUBRICENTRO PONCE",
  "LUNA MAYA",
  "PISOS Y REVESTIMIENTOS SAN LUIS (KASBARIAN)",
  "POSCA EMPAQUES",
  "TECNICA S Y D SRL",
  "VENUS",
];

// Tarifas vigentes (sin IVA): visita primera hora, visita horas restantes, solución remota por hora.
const TARIFAS: [string, number, number, number][] = [
  ["Con soporte", 97620, 59164, 59164],
  ["Sin soporte", 127203, 88746, 88746],
];

// Tipo de soporte → tarifa que usa.
const TIPOS_SOPORTE: [string, string][] = [
  ["Premium", "Con soporte"],
  ["Básico", "Con soporte"],
  ["Por Casos", "Con soporte"],
  ["Order Advanced", "Con soporte"],
  ["Sin Soporte", "Sin soporte"],
];

// Horas por tipo de soporte, en el orden de TIPOS_SOPORTE. "-" = no aplica, "C" = a cotizar, "F" = valor fijo.
type Celda = number | "-" | "C" | "F";
const TAREAS: [string, Celda[]][] = [
  ["Instalación servidor", [4, 4, 4, 4, 4]],
  ["Instalación puesto", ["-", "-", 1, 1, 1]],
  ["Diseño de impresión a medida", ["C", "C", "C", "C", "C"]],
  ["Reacondicionar impresión", ["-", "-", 1, 1, 1]],
  ["Factura electrónica desde cero", [4, 4, 4, 4, 4]],
  ["Factura electrónica con backup", [1, 2, 2, 2, 2]],
  ["Factura electrónica puesto adicional", [1, 1, 1, 1, 1]],
  ["Facturación de exportación", [4, 4, 4, 4, 4]],
  ["Consulta a medida", ["C", "C", "C", "C", "C"]],
  ["Alta razón social", ["F", "F", "F", "F", "F"]],
  ["Migraciones", ["C", "C", "C", "C", "C"]],
  ["Servidor de impresión fiscal", ["-", "-", 1, 1, 1]],
];

const MODO_CELDA = { "-": "no_aplica", C: "a_cotizar", F: "fijo" } as const;

// Cronograma de atención de los sábados (Excel SABADOS.xlsx): fecha, agente activo, agente pasivo.
const SABADOS: [string, string, string][] = [
  ["2026-02-14", "Carol", ""],
  ["2026-02-21", "Karen", "Gaston"],
  ["2026-02-28", "Gaston", "Rodrigo"],
  ["2026-03-07", "Karen", "Rodrigo"],
  ["2026-03-14", "Rodrigo", "Agustin"],
  ["2026-03-21", "Rodrigo", "Karen"],
  ["2026-03-28", "Agustin", "Martin"],
  ["2026-04-04", "Carol", "Karen"],
  ["2026-04-11", "Martin", "Carol"],
  ["2026-04-18", "Martin", "Carol"],
  ["2026-04-25", "Gaston", "Agustin"],
  ["2026-05-02", "Agustin", "Martin"],
  ["2026-05-09", "Rodrigo", "Karen"],
  ["2026-05-16", "Rodrigo", "Karen"],
  ["2026-05-23", "Karen", "Rodrigo"],
  ["2026-05-30", "Karen", "Rodrigo"],
  ["2026-06-06", "Gaston", "Agustin"],
  ["2026-06-13", "Carol", "Gaston"],
  ["2026-06-20", "Feriado", "Feriado"],
  ["2026-06-27", "Martin", "Carol"],
  ["2026-07-04", "Agustin", "Martin"],
  ["2026-07-11", "Agustin", "Gaston"],
  ["2026-07-18", "Martin", "Carol"],
  ["2026-07-25", "Gaston", "Agustin"],
  ["2026-08-01", "Carol", "Martin"],
  ["2026-08-08", "Rodrigo", "Carol"],
  ["2026-08-15", "Gaston", "Agustin"],
  ["2026-08-22", "Carol", "Gaston"],
  ["2026-08-29", "Rodrigo", "TiTa"],
  ["2026-09-05", "Gonzalo", "Rodrigo"],
  ["2026-09-12", "Carol", "Agustin"],
  ["2026-09-19", "TiTa", "Fer"],
  ["2026-09-26", "Agustin", "TiTa"],
  ["2026-10-03", "Fer", "Carol"],
  ["2026-10-10", "Agustin", "Gaston"],
  ["2026-10-17", "Gonzalo", "Rodrigo"],
  ["2026-10-24", "TiTa", "Gonzalo"],
  ["2026-10-31", "Fer", "Gonzalo"],
  ["2026-11-07", "Gaston", "Fer"],
];

const RESPUESTAS: [string, string, string][] = [
  // título, categoría, texto
  ["Saludo inicial", "General", "¡Hola! Gracias por comunicarte con la mesa de ayuda. ¿En qué podemos ayudarte?"],
  ["Pedir datos para acceso remoto", "Acceso remoto", "Para conectarnos necesitamos el ID y la contraseña de AnyDesk que aparecen en tu pantalla. Por favor no cierres el programa hasta que terminemos."],
  ["Caso registrado", "General", "Registramos tu consulta con el número de ticket indicado. Te vamos a contactar apenas tengamos novedades."],
  ["Reinicio del servicio", "Técnico", "Probá cerrar el sistema en todas las PC, reiniciar el servidor y volver a ingresar. Si el problema sigue, avisanos y lo revisamos por acceso remoto."],
  ["Sin llamadas disponibles (Básico)", "Comercial", "Te informamos que este mes ya utilizaste las 5 consultas incluidas en tu plan de soporte Básico. Podemos resolver esta consulta como tarea adicional; te enviamos el presupuesto para que lo apruebes."],
  ["Fuera del plan contratado", "Comercial", "La consulta que nos hacés no está incluida en tu plan de soporte. Podemos resolverla como tarea adicional; te enviamos el presupuesto para que lo apruebes."],
  ["Cierre de caso", "General", "Damos por resuelto el caso. Si vuelve a ocurrir, respondé este mensaje y lo reabrimos. ¡Gracias!"],
  ["Horario de atención", "General", "Nuestro horario de atención es de lunes a viernes de 9 a 18 h. Las consultas recibidas fuera de horario se atienden el siguiente día hábil."],
];

const INFORMES: [string, string, string][] = [
  [
    "Procedimiento: registrar un caso de soporte Básico",
    "Procedimientos",
    "1. Abrí la pestaña **Soporte Básico**.\n2. Tocá **Registrar caso**, elegí la empresa y cargá el número de ticket.\n3. Si la empresa ya tiene **5 casos en el mes**, la app lo avisa: ofrecé la consulta como **tarea adicional** usando el *Cotizador*.\n\n> El número de ticket abre directamente el ticket en el sistema de soporte.",
  ],
  [
    "Notas de release (ejemplo)",
    "Notas de release",
    "## Versión de ejemplo\n\n- Mejora en el listado de stock.\n- Corrección en el cierre de caja.\n\nReemplazá este informe por las notas reales.",
  ],
];

/** Fecha y hora de Argentina (UTC-3) desplazada `minutos` hacia atrás, en formato Postgres. */
function haceMinutos(minutos: number) {
  const d = new Date(Date.now() - 3 * 3600_000 - minutos * 60_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

async function insertMany(d: Driver, table: string, cols: string[], rows: unknown[][]) {
  if (!rows.length) return;
  const values = rows.map((_, i) => `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`);
  await d.query(`insert into ${table} (${cols.join(", ")}) values ${values.join(", ")}`, rows.flat());
}

async function vacia(d: Driver, table: string) {
  return (await d.query(`select not exists (select 1 from ${table}) as vacia`))[0].vacia as boolean;
}

/** Datos reales o necesarios para operar: se cargan si la tabla está vacía. */
export async function seedBase(d: Driver) {
  if (await vacia(d, "empresas_basico")) {
    await insertMany(d, "empresas_basico", ["nombre"], EMPRESAS_BASICO.map((n) => [n]));
  }
  if (await vacia(d, "tarifas")) {
    await insertMany(
      d,
      "tarifas",
      ["nombre", "visita_primera", "visita_restantes", "remota_hora", "orden"],
      TARIFAS.map((t, i) => [...t, i + 1]),
    );
  }
  if (await vacia(d, "tipos_soporte")) {
    const tarifas = await d.query("select id, nombre from tarifas");
    await insertMany(
      d,
      "tipos_soporte",
      ["nombre", "tarifa_id", "orden"],
      TIPOS_SOPORTE.map(([n, tarifa], i) => [n, tarifas.find((t) => t.nombre === tarifa)!.id, i + 1]),
    );
  }
  if (await vacia(d, "tareas_cotizables")) {
    await insertMany(d, "tareas_cotizables", ["nombre", "orden"], TAREAS.map(([n], i) => [n, i + 1]));
    const tareas = await d.query("select id, nombre from tareas_cotizables");
    const tipos = await d.query("select id, nombre from tipos_soporte");
    const celdas: unknown[][] = [];
    for (const [nombre, valores] of TAREAS) {
      const tareaId = tareas.find((t) => t.nombre === nombre)!.id;
      TIPOS_SOPORTE.forEach(([tipo], i) => {
        const tipoId = tipos.find((t) => t.nombre === tipo)?.id;
        const v = valores[i];
        if (tipoId) celdas.push([tareaId, tipoId, typeof v === "number" ? "horas" : MODO_CELDA[v], typeof v === "number" ? v : null]);
      });
    }
    await insertMany(d, "tarea_soporte", ["tarea_id", "tipo_id", "modo", "valor"], celdas);
  }
  if (await vacia(d, "sabados")) {
    const nombres = [...new Set(SABADOS.flatMap(([, a, p]) => [a, p]))].filter((n) => n && n !== "Feriado");
    if (await vacia(d, "agentes")) await insertMany(d, "agentes", ["nombre"], nombres.map((n) => [n]));
    const agentes = await d.query("select id, nombre from agentes");
    const id = (n: string) => agentes.find((a) => a.nombre === n)?.id ?? null;
    await insertMany(
      d,
      "sabados",
      ["fecha", "tanda", "feriado", "activa_id", "pasiva_id"],
      SABADOS.map(([fecha, a, p]) => [fecha, 1, a === "Feriado", id(a), id(p)]),
    );
  }
}

/** Ejemplos para una base nueva (se omiten con SEED_DEMO=false). */
export async function seedDemo(d: Driver) {
  if (await vacia(d, "respuestas")) await insertMany(d, "respuestas", ["titulo", "categoria", "texto"], RESPUESTAS);
  if (await vacia(d, "informes")) await insertMany(d, "informes", ["titulo", "categoria", "contenido"], INFORMES);

  await d.query(
    `insert into novedades (mes, titulo, texto) values
       (date_trunc('month', now() at time zone 'UTC' - interval '3 hours'), $1, $2),
       (date_trunc('month', now() at time zone 'UTC' - interval '3 hours'), $3, $4)`,
    [
      "Bienvenidos a la nueva mesa de ayuda",
      "Desde este mes registramos los casos de soporte **Básico** con su número de ticket.",
      "Guardias de fin de mes",
      "Revisar el cronograma de guardias para el cierre de mes.",
    ],
  );

  // Algunos casos de ejemplo (tickets ficticios) para ver el contador mensual.
  const empresas = await d.query("select id from empresas_basico order by nombre limit 3");
  const casos: unknown[][] = [];
  [6, 3, 1].forEach((cantidad, e) => {
    for (let i = 0; i < cantidad; i++) {
      casos.push([empresas[e].id, 900000 + e * 100 + i, haceMinutos(60 + i * 1440 + e * 90)]);
    }
  });
  await insertMany(d, "casos", ["empresa_id", "ticket", "fecha"], casos);
}
