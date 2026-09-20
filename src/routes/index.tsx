import { createFileRoute, Link } from "@tanstack/react-router";
import { EvidenceQuote } from "@/components/evidence-quote";
import { formatDate } from "@/components/format-date";
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
        <Button asChild size="lg">
          <Link to="/routes">Read the routes</Link>
        </Button>
        <div className="mt-4 flex flex-col items-start gap-2 text-small sm:flex-row sm:gap-5">
          <Link to="/check" className="font-medium text-primary underline underline-offset-2">
            See the figures and readings that apply to you
          </Link>
          <Link to="/changes" className="font-medium text-primary underline underline-offset-2">
            See what is changing
          </Link>
        </div>
      </div>

      <p className="prose-measure mt-14 text-body text-muted-foreground">
        {routes.length} routes, {requirementCount} requirements and {sourceCount} quotes.{" "}
        {verifiedCount} of {routes.length} routes verified.
      </p>

      {exampleRoute && exampleRequirement && (
        <section className="mt-8 border-y border-border py-6">
          <p className="text-body">{exampleRequirement.text}</p>
          <p className="mt-2 text-small text-muted-foreground">
            <Link
              to="/routes/$routeId"
              params={{ routeId: exampleRoute.routeId }}
              className="font-medium text-primary underline underline-offset-2"
            >
              {exampleRoute.name}
            </Link>
            {exampleRoute.verifiedOn
              ? ` · Verified ${formatDate(exampleRoute.verifiedOn)}`
              : " · Not yet verified"}
          </p>
          <div className="mt-5 space-y-5">
            {exampleRequirement.sources.map((source) => (
              <div key={source.url + source.quote}>
                <EvidenceQuote quote={source.quote} translation={source.translation} />
                <p className="mt-2 text-caption text-muted-foreground">
                  {source.publisher}. Retrieved {formatDate(source.retrievedOn)}.{" "}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Source
                  </a>
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
