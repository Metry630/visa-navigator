import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_AGENTS = ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit", "*"];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const body =
          ALLOWED_AGENTS.map((agent) => `User-agent: ${agent}\nAllow: /\n`).join("\n") +
          `\nSitemap: ${new URL("/sitemap.xml", origin).href}\n`;

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
