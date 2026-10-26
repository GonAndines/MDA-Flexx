// Derivador IVR de la central telefónica. Para cambiar el menú, editar este archivo.

export type OpcionIvr = { n: number; nombre: string; detalle?: string; hijos?: OpcionIvr[] };

export const CENTRAL = { telefono: "0351-5685000", interno: "7777" };

export const IVR: OpcionIvr[] = [
  { n: 1, nombre: "Comercial" },
  {
    n: 2,
    nombre: "Atención al cliente",
    hijos: [
      {
        n: 1,
        nombre: "ERP",
        hijos: [
          { n: 1, nombre: "Soporte" },
          { n: 2, nombre: "Implementación" },
          { n: 3, nombre: "Desarrollo" },
          { n: 4, nombre: "Mantenimiento" },
          { n: 5, nombre: "Integraciones" },
        ],
      },
      { n: 2, nombre: "Datacenter", detalle: "Directo: 0351-5691101" },
      { n: 3, nombre: "Ecommerce" },
      { n: 4, nombre: "BI" },
    ],
  },
  { n: 3, nombre: "Soporte partner" },
  { n: 4, nombre: "Administración" },
];
