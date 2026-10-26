import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
