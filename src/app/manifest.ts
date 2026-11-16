import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Web-Manifest: „Zum Home-Bildschirm“ auf iPad und Android. Pfade relativ, damit der basePath passt. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PointPilot",
    short_name: "PointPilot",
    description: "Persönlicher Meilen- & Punkte-Optimizer",
    lang: "de",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#070f1f",
    theme_color: "#070f1f",
    icons: [
      { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
