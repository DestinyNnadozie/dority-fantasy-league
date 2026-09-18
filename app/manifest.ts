import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "D-Ligue 1 Fantasy",
    short_name: "D-Ligue 1",
    description: "School fantasy football",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
