import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zenzo",
    short_name: "Zenzo",
    description:
      "Membership management for gyms, martial arts, dance, and yoga clubs.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#C84A08",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
