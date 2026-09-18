import { createFileRoute } from "@tanstack/react-router";
import { listRoutes } from "@/engine";

const STATIC_PATHS = ["/", "/check", "/routes", "/changes", "/methodology"];

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[
        character
      ] ?? character,
  );
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = [
          ...STATIC_PATHS,
          ...listRoutes().map((route) => `/routes/${encodeURIComponent(route.routeId)}`),
        ];
        const urls = paths
          .map((path) => `<url><loc>${escapeXml(new URL(path, origin).href)}</loc></url>`)
          .join("");
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});