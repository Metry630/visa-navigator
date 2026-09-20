import { createFileRoute } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { getRoute, listRoutes } from "@/engine";

/**
 * Internal only. This page exists to be screenshotted at 1200x630 into
 * public/og.png. It is not in the nav and not in the sitemap.
 * Sizes here are fixed steps on purpose: it is rendered at one size only.
 */
export const Route = createFileRoute("/og")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }, { title: "Share card | Visa Routes" }],
  }),
  component: OgCard,
});

function OgCard() {
  const routes = listRoutes();
  const details = routes.flatMap((route) => {
    const detail = getRoute(route.routeId);
    return detail ? [detail] : [];
  });
  const requirementCount = details.reduce((total, detail) => total + detail.requirements.length, 0);
  const sourceCount = details.reduce(
    (total, detail) =>
      total +
      detail.requirements.reduce((count, requirement) => count + requirement.sources.length, 0),
    0,
  );
  const verifiedCount = routes.filter((route) => route.verifiedOn).length;

  return (
    <div className="flex justify-center bg-background p-6">
      <div
        id="og-card"
        style={{ width: 1200, height: 630 }}
        className="flex shrink-0 flex-col justify-between border-l-8 border-primary bg-background px-24 py-20"
      >
        <Wordmark className="text-4xl" />
        <p className="font-serif text-6xl leading-tight text-foreground">
          Every work visa rule, quoted from the page it came from.
        </p>
        <p className="font-sans text-2xl text-muted-foreground">
          Singapore and Japan. {routes.length} routes, {requirementCount} rules and {sourceCount}{" "}
          quotes. {verifiedCount} of {routes.length} verified by a person.
        </p>
      </div>
    </div>
  );
}
