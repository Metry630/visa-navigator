import { createFileRoute, Link } from "@tanstack/react-router";
import { EvidenceQuote } from "@/components/evidence-quote";
import { formatDate } from "@/components/format-date";
import { OutboundLink, SiteLink } from "@/components/links";
import { Button } from "@/components/ui/button";
import { getRoute, listRoutes } from "@/engine";

const CLAIM = "Every work visa rule, quoted from the page it came from.";
const CLAIM_DESCRIPTION =
  "Work visa routes for new graduates in Singapore and Japan. Every rule is quoted from the official page it came from, and a person checks each one against it.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Visa Routes | ${CLAIM}` },
      { name: "description", content: CLAIM_DESCRIPTION },
      { property: "og:title", content: `Visa Routes | ${CLAIM}` },
      { property: "og:description", content: CLAIM_DESCRIPTION },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
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
  const exampleRoute = getRoute("sg-employment-pass");
  const exampleRequirement = exampleRoute?.requirements.find(
    (requirement) => requirement.id === "salary-floor-2026",
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <h1 className="prose-measure text-display font-semibold text-balance">{CLAIM}</h1>
      <p className="prose-measure mt-5 text-subhead text-muted-foreground">
        Singapore and Japan. {routes.length} routes, {requirementCount} rules and {sourceCount}{" "}
        quotes. {verifiedCount} of {routes.length} verified by a person.
      </p>
      <div className="mt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
          <div className="max-w-xs">
            <Button asChild size="lg">
              <Link to="/check">Check my options</Link>
            </Button>
            <p className="mt-3 text-small text-muted-foreground">
              Answer four questions and see which routes are open to you.
            </p>
          </div>
          <div className="max-w-xs">
            <Button asChild size="lg" variant="outline">
              <Link to="/routes">Browse all routes</Link>
            </Button>
            <p className="mt-3 text-small text-muted-foreground">
              All {routes.length} routes for Singapore and Japan, with every rule and its source.
            </p>
          </div>
        </div>
        <div className="mt-6 text-small">
          <SiteLink to="/changes">See what is changing</SiteLink>
        </div>
      </div>

      {exampleRoute && exampleRequirement && (
        <section className="mt-14 border-y border-border py-6">
          <p className="text-body">{exampleRequirement.text}</p>
          <p className="mt-2 text-small text-muted-foreground">
            <SiteLink to="/routes/$routeId" params={{ routeId: exampleRoute.routeId }}>
              {exampleRoute.name}
            </SiteLink>
            {exampleRoute.verifiedOn
              ? ` · Verified ${formatDate(exampleRoute.verifiedOn)}`
              : " · Not yet verified"}
          </p>
          <div className="mt-5 space-y-5">
            {exampleRequirement.sources.map((source) => (
              <div key={source.url + source.quote}>
                <EvidenceQuote quote={source.quote} translation={source.translation} />
                <p className="mt-2 text-caption text-muted-foreground">
                  <OutboundLink href={source.url}>{source.publisher}</OutboundLink> · Retrieved{" "}
                  {formatDate(source.retrievedOn)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="prose-measure mt-14 space-y-2 border-t border-border pt-8 text-body text-muted-foreground">
        <p>Singapore and Japan today. More countries are being added.</p>
        <p>Every rule links to an official source, and a person checks each one against it.</p>
      </div>
    </div>
  );
}
