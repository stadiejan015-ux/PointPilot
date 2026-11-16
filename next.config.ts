import type { NextConfig } from "next";

/**
 * Statischer Export für GitHub Pages.
 * PAGES_BASE_PATH wird im GitHub-Actions-Workflow gesetzt (z. B. "/PointPilot").
 * Lokal bleibt er leer, damit `npm run dev` unter http://localhost:3000 läuft.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
