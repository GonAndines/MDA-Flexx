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

// Valores de ejemplo: reemplazar por el cuadro real.
const TIPOS_SOPORTE: [string, number][] = [
  ["Premium", 30000],
  ["Básico", 40000],
  ["Order Advanced", 35000],
  ["Por Casos", 50000],
  ["Sin Soporte", 60000],
];

// Tareas de ejemplo: reemplazar por el listado real.
const TAREAS: [string, string, number][] = [
  ["Migración de servidor", "Traspaso de base de datos y sistema a un nuevo servidor", 4],
  ["Instalación en nueva PC", "Instalación y configuración del sistema en un puesto", 1],
  ["Renovación de certificado AFIP/ARCA", "Generación e instalación del certificado de factura electrónica", 1],
  ["Recupero de backup", "Restauración de la base desde una copia de seguridad", 3],
  ["Capacitación", "Capacitación a usuarios, remota", 2],
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
  if (await vacia(d, "tipos_soporte")) {
    await insertMany(d, "tipos_soporte", ["nombre", "valor_hora", "orden"], TIPOS_SOPORTE.map(([n, v], i) => [n, v, i + 1]));
  }
  if (await vacia(d, "tareas_cotizables")) {
    await insertMany(d, "tareas_cotizables", ["nombre", "descripcion", "horas"], TAREAS);
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
