import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Muromío — Interior Studio",
    short_name: "Muromío",
    description: "Estudio de interiorismo en León, Guanajuato, con renders de IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFE7DC",
    theme_color: "#262220",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
