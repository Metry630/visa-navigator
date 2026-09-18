import { createFileRoute } from "@tanstack/react-router";

/**
 * Internal only. This page exists to be screenshotted at 1200x630 into
 * public/og.png. It is not in the nav and not in the sitemap.
 */
export const Route = createFileRoute("/og")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }, { title: "Share card | Visa Routes" }],
  }),
  component: OgCard,
});

function OgCard() {
  return (
    <div className="flex justify-center bg-background p-6">
      <div
        id="og-card"
        style={{ width: 1200, height: 630 }}
        className="flex shrink-0 flex-col justify-between border-l-8 border-primary bg-background px-24 py-20"
      >
        <p className="font-sans text-2xl tracking-[0.2em] text-muted-foreground uppercase">
          Visa Routes
        </p>
        <p className="font-serif text-7xl leading-tight text-foreground">
          Work visa routes for new graduates, with every rule linked to its official source.
        </p>
        <div className="h-1 w-40 bg-primary" />
      </div>
    </div>
  );
}
