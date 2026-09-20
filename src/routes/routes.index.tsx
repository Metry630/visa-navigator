import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDate } from "@/components/format-date";
import {
  DESTINATIONS,
  formatMoney,
  listRoutes,
  type RouteFacts,
  type RouteSummary,
} from "@/engine";

const DESCRIPTION =
  "Work visa routes for new graduates, with every rule linked to its official source.";

export const Route = createFileRoute("/routes/")({
  head: () => ({
    meta: [
      { title: "Routes covered | Visa Routes" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Routes covered | Visa Routes" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/routes" },
    ],
    links: [{ rel: "canonical", href: "/routes" }],
  }),
  component: RoutesLibrary,
});

const DEGREE_TEXT: Record<string, string> = {
  none: "no degree needed",
  diploma: "diploma or higher",
  bachelor: "bachelor's degree or higher",
  master: "master's degree or higher",
  doctorate: "doctorate",
};

/**
 * Every line here is a restatement of a fact the engine already carries on `facts`, so the table can
 * compare routes without anyone writing a rule into the UI. A missing field means the route has no
 * requirement of that kind, so it contributes nothing rather than a dash.
 */
function limitsLine(facts: RouteFacts): string {
  const parts: string[] = [];

  if (facts.age) {
    const { min, max } = facts.age;
    if (min !== undefined && max !== undefined) parts.push(`age ${min} to ${max}`);
    else if (min !== undefined) parts.push(`age ${min} and over`);
    else if (max !== undefined) parts.push(`age ${max} and under`);
  }

  if (facts.minDegree) {
    const text = DEGREE_TEXT[facts.minDegree];
    if (text) parts.push(text);
  }

  if (facts.nationalityList) {
    const { mode, count } = facts.nationalityList;
    parts.push(
      mode === "allow" ? `open to ${count} nationalities` : `closed to ${count} nationalities`,
    );
  }

  if (facts.salaryFloor) {
    const { amount, currency, period } = facts.salaryFloor;
    parts.push(`from ${formatMoney(amount, currency)} a ${period}`);
  }

  return parts.join(" · ");
}

function checksLine(checks: RouteFacts["checks"]): string {
  return (
    [
      [checks.you, "you"],
      [checks.employer, "employer"],
      [checks.authority, "authority"],
    ] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, who]) => `${count} ${who}`)
    .join(" · ");
}

/** Hidden from assistive tech: the real association comes from the table's own header cells. */
function CellLabel({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="font-medium text-foreground sm:hidden">
      {children}:{" "}
    </span>
  );
}

function RouteTable({ routes, caption }: { routes: RouteSummary[]; caption: string }) {
  return (
    <table className="route-table mt-3 w-full border-collapse text-left sm:table-fixed">
      <caption className="sr-only">{caption}</caption>
      <thead className="route-table-head text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        <tr className="border-y border-border">
          <th scope="col" className="w-[42%] py-2 pr-4 font-semibold">
            Route
          </th>
          <th scope="col" className="w-[14%] py-2 pr-4 font-semibold">
            Who applies
          </th>
          <th scope="col" className="w-[22%] py-2 pr-4 font-semibold">
            What decides it
          </th>
          <th scope="col" className="w-[22%] py-2 font-semibold">
            Verified
          </th>
        </tr>
      </thead>
      <tbody>
        {routes.map((route) => {
          const limits = limitsLine(route.facts);
          return (
            <tr key={route.routeId} className="border-b border-border align-top">
              <th scope="row" className="py-4 pr-4 text-left font-normal">
                <span className="text-subhead font-semibold">
                  <Link
                    to="/routes/$routeId"
                    params={{ routeId: route.routeId }}
                    className="break-words underline-offset-4 hover:underline"
                  >
                    {route.name}
                  </Link>
                </span>
                {limits && (
                  <span className="mt-1 block text-small tabular-nums text-muted-foreground">
                    {limits}
                  </span>
                )}
                <span className="mt-1 block text-body text-muted-foreground">{route.summary}</span>
              </th>
              <td className="py-4 pr-4 text-body">
                <CellLabel>Who applies</CellLabel>
                {route.requiresEmployer ? "An employer" : "You"}
              </td>
              <td className="py-4 pr-4 text-body tabular-nums">
                <CellLabel>What decides it</CellLabel>
                {checksLine(route.facts.checks)}
              </td>
              <td className="py-4 text-body tabular-nums text-muted-foreground sm:whitespace-nowrap">
                {route.verifiedOn ? `Verified ${formatDate(route.verifiedOn)}` : "Not yet verified"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RoutesLibrary() {
  const routes = listRoutes();

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-title font-semibold">Routes covered</h1>
      <p className="prose-measure mt-4 text-subhead text-muted-foreground">
        These are the routes Visa Routes covers. Anyone can read them without answering anything.
      </p>

      <div className="mt-12 space-y-12">
        {DESTINATIONS.map((destination) => {
          const destinationRoutes = routes.filter(
            (route) => route.destination === destination.code,
          );
          const groups = [
            {
              title: "Start without an employer",
              routes: destinationRoutes.filter((route) => !route.requiresEmployer),
            },
            {
              title: "An employer applies for you",
              routes: destinationRoutes.filter((route) => route.requiresEmployer),
            },
          ];

          return (
            <section key={destination.code}>
              <h2 className="text-section font-semibold">{destination.name}</h2>
              <div className="mt-6 space-y-8">
                {groups.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      {group.title} ({group.routes.length})
                    </h3>
                    <RouteTable
                      routes={group.routes}
                      caption={`${destination.name}: ${group.title}`}
                    />
                  </section>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
