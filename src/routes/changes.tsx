import { createFileRoute } from "@tanstack/react-router";
import { EvidenceQuote } from "@/components/evidence-quote";
import { formatDate } from "@/components/format-date";
import { OutboundLink, SiteLink } from "@/components/links";
import { getRoute, listRoutes, type RequirementView, type RouteDetail } from "@/engine";

const DESCRIPTION =
  "Rules with a date attached, so you can see what is changing before it changes.";

export const Route = createFileRoute("/changes")({
  head: () => ({
    meta: [
      { title: "What is changing | Visa Routes" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "What is changing | Visa Routes" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/changes" },
    ],
    links: [{ rel: "canonical", href: "/changes" }],
  }),
  component: ChangesPage,
});

interface DatedRule {
  date: string;
  requirement: RequirementView;
  route: RouteDetail;
}

function groupByDate(rules: DatedRule[]) {
  const groups = new Map<string, DatedRule[]>();
  for (const rule of rules) {
    const group = groups.get(rule.date) ?? [];
    group.push(rule);
    groups.set(rule.date, group);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

function DatedRules({ rules }: { rules: DatedRule[] }) {
  return (
    <div className="mt-5 space-y-10">
      {groupByDate(rules).map(([date, dateRules]) => (
        <section key={date} aria-labelledby={`change-${date}`}>
          <h3 id={`change-${date}`} className="text-subhead font-semibold">
            {formatDate(date)}
          </h3>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {dateRules.map(({ requirement, route }) => (
              <li key={`${route.routeId}-${requirement.id}-${date}`} className="py-5">
                <p className="text-body">{requirement.text}</p>
                <p className="mt-2 text-small text-muted-foreground">
                  <SiteLink to="/routes/$routeId" params={{ routeId: route.routeId }}>
                    {route.name}
                  </SiteLink>
                </p>
                <div className="mt-4 space-y-4">
                  {requirement.sources.map((source) => (
                    <div key={source.url + source.quote}>
                      <EvidenceQuote quote={source.quote} translation={source.translation} />
                      <p className="mt-2 text-caption text-muted-foreground">
                        <OutboundLink href={source.url}>{source.publisher}</OutboundLink> ·
                        Retrieved {formatDate(source.retrievedOn)}
                      </p>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ChangesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const routes = listRoutes()
    .map((route) => getRoute(route.routeId))
    .filter((route): route is RouteDetail => Boolean(route));
  const inForce: DatedRule[] = [];
  const coming: DatedRule[] = [];

  for (const route of routes) {
    for (const requirement of route.requirements) {
      const from = requirement.effective?.from;
      const to = requirement.effective?.to;
      if (from && from <= today) inForce.push({ date: from, requirement, route });
      if (from && from > today) coming.push({ date: from, requirement, route });
      if (to && to >= today) coming.push({ date: to, requirement, route });
    }
  }

  const hasDatedRules = inForce.length > 0 || coming.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-title font-semibold">What is changing</h1>
      <p className="prose-measure mt-4 text-subhead text-muted-foreground">
        Rules with a date attached, so you can see what is changing before it changes.
      </p>

      {!hasDatedRules ? (
        <p className="mt-10 text-body text-muted-foreground">
          There are no dated rules at the moment.
        </p>
      ) : (
        <div className="mt-12 space-y-14">
          {inForce.length > 0 && (
            <section aria-labelledby="in-force-heading">
              <h2 id="in-force-heading" className="text-section font-semibold">
                Already in force
              </h2>
              <DatedRules rules={inForce} />
            </section>
          )}
          {coming.length > 0 && (
            <section aria-labelledby="coming-heading">
              <h2 id="coming-heading" className="text-section font-semibold">
                Coming
              </h2>
              <DatedRules rules={coming} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
