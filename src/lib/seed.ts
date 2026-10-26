import type { Driver } from "./db";

// Datos de ejemplo para arrancar. Todo se puede editar o borrar desde la aplicación.

const PLANES = [
  {
    nombre: "Premium",
    descripcion: "Soporte completo con prioridad alta.",
    incluye: "Consultas telefónicas, por mail y remotas sin límite\nPrioridad alta en la cola de atención\nCapacitación de 2 horas mensuales\nInstalación de actualizaciones\nSeguimiento de incidentes hasta su cierre",
    horario: "Lunes a viernes de 8 a 20 h",
    tiempo_respuesta: "2 horas hábiles",
    llamadas_mes: null,
    abono_mensual: 250000,
  },
  {
    nombre: "Básico",
    descripcion: "Consultas de uso del sistema.",
    incluye: "Consultas telefónicas y por mail sobre el uso del sistema\nHasta 10 llamadas por mes\nAcceso remoto solo para diagnóstico",
    horario: "Lunes a viernes de 9 a 18 h",
    tiempo_respuesta: "24 horas hábiles",
    llamadas_mes: 10,
    abono_mensual: 90000,
  },
  {
    nombre: "Por Casos",
    descripcion: "Sin abono: cada caso se presupuesta y factura por separado.",
    incluye: "Atención a demanda\nCada caso se cotiza según la tabla de tareas adicionales",
    horario: "Lunes a viernes de 9 a 18 h",
    tiempo_respuesta: "48 horas hábiles",
    llamadas_mes: null,
    abono_mensual: null,
  },
  {
    nombre: "Order Advanced",
    descripcion: "Soporte para clientes del módulo Order Advanced (completar con el alcance real).",
    incluye: "Consultas sobre el módulo Order Advanced\nHasta 20 llamadas por mes\nAcceso remoto",
    horario: "Lunes a viernes de 9 a 18 h",
    tiempo_respuesta: "8 horas hábiles",
    llamadas_mes: 20,
    abono_mensual: 150000,
  },
  {
    nombre: "Sin Soporte",
    descripcion: "No tiene soporte contratado.",
    incluye: "Solo se atiende con presupuesto previo de tareas adicionales",
    horario: "",
    tiempo_respuesta: "",
    llamadas_mes: 0,
    abono_mensual: null,
  },
];

const EMPRESAS: [string, string, string, string, string, string][] = [
  // nombre, cuit, contacto, teléfono, email, plan
  ["Distribuidora del Sur S.A.", "30-71234567-1", "Mariana López", "011 4567-1200", "sistemas@delsur.com.ar", "Premium"],
  ["Ferretería Industrial Norte", "30-70987654-3", "Jorge Pérez", "0351 422-3311", "administracion@fnorte.com.ar", "Básico"],
  ["Alimentos La Pampa S.R.L.", "30-71555444-9", "Lucía Fernández", "02954 43-2100", "compras@lapampa.com.ar", "Order Advanced"],
  ["Logística Cuyo", "30-71222333-5", "Martín Gómez", "0261 425-8800", "it@logcuyo.com.ar", "Premium"],
  ["Textil Patagonia", "30-70111222-7", "Sofía Ruiz", "0299 448-1020", "sruiz@textilpatagonia.com.ar", "Básico"],
  ["Comercial Litoral", "30-71888999-0", "Diego Romero", "0342 455-6070", "dromero@comlitoral.com.ar", "Por Casos"],
  ["Agro Insumos Pergamino", "30-71666777-2", "Carolina Díaz", "02477 43-9090", "cdiaz@agropergamino.com.ar", "Order Advanced"],
  ["Librería Central", "20-28444555-6", "Pablo Sosa", "011 4300-2211", "libreriacentral@gmail.com", "Sin Soporte"],
];

const RESPUESTAS: [string, string, string][] = [
  // título, categoría, texto
  ["Saludo inicial", "General", "¡Hola! Gracias por comunicarte con la mesa de ayuda. ¿En qué podemos ayudarte?"],
  ["Pedir datos para acceso remoto", "Acceso remoto", "Para conectarnos necesitamos el ID y la contraseña de AnyDesk que aparecen en tu pantalla. Por favor no cierres el programa hasta que terminemos."],
  ["Caso registrado", "General", "Registramos tu consulta con el número de caso indicado. Te vamos a contactar apenas tengamos novedades."],
  ["Reinicio del servicio", "Técnico", "Probá cerrar el sistema en todas las PC, reiniciar el servidor y volver a ingresar. Si el problema sigue, avisanos y lo revisamos por acceso remoto."],
  ["Error de licencia", "Técnico", "El mensaje de licencia suele aparecer cuando cambió el equipo servidor. Pasanos el código que muestra la pantalla y te enviamos la nueva clave."],
  ["Fuera del plan contratado", "Comercial", "La consulta que nos hacés no está incluida en tu plan de soporte. Podemos resolverla como tarea adicional; te enviamos el presupuesto para que lo apruebes."],
  ["Sin soporte vigente", "Comercial", "Por el momento tu empresa no tiene un plan de soporte vigente. Si querés, te pasamos las opciones de planes o un presupuesto por esta consulta puntual."],
  ["Cierre de caso", "General", "Damos por resuelto el caso. Si vuelve a ocurrir, respondé este mensaje y lo reabrimos. ¡Gracias!"],
  ["Facturación electrónica rechazada", "Técnico", "El rechazo de AFIP/ARCA suele deberse a un certificado vencido o a un dato fiscal del cliente. Verificá el CUIT y la condición de IVA; si está todo bien, revisamos el certificado."],
  ["Horario de atención", "General", "Nuestro horario de atención es de lunes a viernes de 9 a 18 h. Las consultas recibidas fuera de horario se atienden el siguiente día hábil."],
];

const TAREAS: [string, string, string, number][] = [
  // nombre, descripción, unidad, valor
  ["Hora de soporte técnico", "Atención remota o telefónica fuera del plan", "hora", 35000],
  ["Visita en sitio (CABA/GBA)", "Traslado y primera hora de trabajo en el domicilio del cliente", "visita", 85000],
  ["Instalación en nueva PC", "Instalación y configuración del sistema en un puesto", "puesto", 45000],
  ["Migración de servidor", "Traspaso de base de datos y sistema a un nuevo servidor", "unidad", 280000],
  ["Capacitación", "Capacitación a usuarios, remota o presencial", "hora", 40000],
  ["Renovación de certificado AFIP/ARCA", "Generación e instalación del certificado de factura electrónica", "unidad", 30000],
  ["Desarrollo de reporte a medida", "Diseño de un informe o listado personalizado", "hora", 55000],
  ["Recupero de backup", "Restauración de la base de datos desde una copia de seguridad", "unidad", 120000],
];

const MOTIVOS = [
  "No puede emitir facturas electrónicas",
  "Consulta sobre listado de stock",
  "Error al ingresar al sistema",
  "Configurar nueva impresora fiscal",
  "Duda con el cierre de caja",
  "Lentitud general del sistema",
  "Alta de usuario nuevo",
  "Pedido no impacta en Order Advanced",
  "Diferencia en cuenta corriente de cliente",
  "Actualización de versión",
];

const RESOLUCIONES = [
  "Se renovó el certificado y se reintentó la emisión.",
  "Se explicó el filtro correcto del listado.",
  "Se reinició el servicio en el servidor.",
  "Se configuró el puerto de la impresora por acceso remoto.",
  "Se guió al usuario paso a paso.",
];

/** Fecha y hora de Argentina (UTC-3) desplazada `minutos` hacia atrás, en formato Postgres. */
function haceMinutos(minutos: number) {
  const d = new Date(Date.now() - 3 * 3600_000 - minutos * 60_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

async function insertMany(d: Driver, table: string, cols: string[], rows: unknown[][]) {
  const values = rows.map((_, i) => `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`);
  await d.query(`insert into ${table} (${cols.join(", ")}) values ${values.join(", ")}`, rows.flat());
}

export async function seed(d: Driver) {
  await insertMany(
    d,
    "planes",
    ["nombre", "descripcion", "incluye", "horario", "tiempo_respuesta", "llamadas_mes", "abono_mensual", "orden"],
    PLANES.map((p, i) => [p.nombre, p.descripcion, p.incluye, p.horario, p.tiempo_respuesta, p.llamadas_mes, p.abono_mensual, i + 1]),
  );
  const planes = await d.query("select id, nombre from planes");
  const planId = (nombre: string) => planes.find((p) => p.nombre === nombre)?.id ?? null;

  await insertMany(
    d,
    "empresas",
    ["nombre", "cuit", "contacto", "telefono", "email", "plan_id"],
    EMPRESAS.map(([nombre, cuit, contacto, tel, email, plan]) => [nombre, cuit, contacto, tel, email, planId(plan)]),
  );
  const empresas = await d.query("select id, contacto from empresas order by id");

  await insertMany(d, "respuestas", ["titulo", "categoria", "texto"], RESPUESTAS);
  await insertMany(d, "tareas", ["nombre", "descripcion", "unidad", "valor"], TAREAS);

  // ~45 llamadas repartidas en los últimos 30 días, 6 de ellas hoy.
  // Reparto desparejo entre las 7 primeras empresas; la última (sin soporte) llama una sola vez, más abajo.
  const patron = [0, 1, 2, 0, 3, 1, 4, 0, 5, 2, 6, 1];
  const llamadas: unknown[][] = [];
  for (let i = 0; i < 45; i++) {
    const empresa = empresas[patron[i % patron.length]];
    const minutos = i < 6 ? 20 + i * 35 : (Math.floor(i / 2) + 1) * 1440 + ((i * 97) % 480);
    const estado = i < 6 ? ["pendiente", "en_curso", "resuelta"][i % 3] : i % 9 === 0 ? "pendiente" : "resuelta";
    llamadas.push([
      empresa.id,
      empresa.contacto,
      haceMinutos(minutos),
      MOTIVOS[(i * 3) % MOTIVOS.length],
      estado,
      estado === "resuelta" ? RESOLUCIONES[i % RESOLUCIONES.length] : "",
    ]);
  }
  llamadas.push([empresas[empresas.length - 1].id, "Pablo Sosa", haceMinutos(3 * 1440), "Consulta por precio de actualización", "resuelta", "Se envió presupuesto de tareas adicionales."]);
  await insertMany(d, "llamadas", ["empresa_id", "contacto", "fecha", "motivo", "estado", "resolucion"], llamadas);
}
