import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El CLI `next upgrade` deja anotado que este proyecto se actualizó por el aviso de seguridad.
  experimental: {
    agentUpgrade: "security",
  },
  // PGlite (Postgres embebido para desarrollo local) trae archivos WASM que no deben empaquetarse.
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
