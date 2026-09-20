import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDate } from "@/components/format-date";
import { DESTINATIONS, formatMoney, listRoutes, type RouteFacts } from "@/engine";

const DESCRIPTION =
  "Work visa routes for new graduates, with every rule linked to its official source.";

const DEGREE_LABELS: Record<RouteFacts["minDegree"] & string, string> = {
  none: "No degree required",
  diploma: "Diploma",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate",
};

/** One line of limits per route, restated from the engine's facts. Nothing here is authored. */
function limitsLine(facts: RouteFacts): string {
  const parts: string[] = [];

  if (facts.age) {
    const { min, max } = facts.age;
    if (min !== undefined && max !== undefined) parts.push(`Age ${min} to ${max}`);
    else if (max !== undefined) parts.push(`Age ${max} or below`);
    else if (min !== undefined) parts.push(`Age ${min} or above`);
  }
  if (facts.minDegree) parts.push(DEGREE_LABELS[facts.minDegree]);
  if (facts.nationalityList) {
    parts.push(
      facts.nationalityList.mode === "allow"
        ? `Listed nationalities only (${facts.nationalityList.count})`
        : `Closed to listed nationalities (${facts.nationalityList.count})`,
    );
  }
  if (facts.salaryFloor) {
    parts.push(
      `${formatMoney(facts.salaryFloor.amount, facts.salaryFloor.currency)} per ${facts.salaryFloor.period}`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "None in effect";
}

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

function CellLabel({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="mb-1 block text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:hidden"
    >
      {children}
    </span>
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
              <div className="mt-6 space-y-10">
                {groups.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-subhead font-semibold">
                      {group.title}{" "}
                      <span className="text-muted-foreground">({group.routes.length})</span>
                    </h3>

                    {group.routes.length > 0 && (
                      <table role="table" className="route-table mt-4 w-full text-left">
                        <thead role="rowgroup">
                          <tr role="row">
                            <th
                              scope="col"
                              role="columnheader"
                              className="pb-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              Route
                            </th>
                            <th
                              scope="col"
                              role="columnheader"
                              className="pb-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              Limits
                            </th>
                            <th
                              scope="col"
                              role="columnheader"
                              className="pb-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              Checks
                            </th>
                            <th
                              scope="col"
                              role="columnheader"
                              className="pb-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              Verified
                            </th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          {group.routes.map((route) => (
                            <tr key={route.routeId} role="row">
                              <th scope="row" role="rowheader" className="min-w-0">
                                <Link
                                  to="/routes/$routeId"
                                  params={{ routeId: route.routeId }}
                                  className="break-words text-subhead font-semibold underline-offset-4 hover:underline"
                                >
                                  {route.name}
                                </Link>
                                <p className="prose-measure mt-1 text-small text-muted-foreground">
                                  {route.summary}
                                </p>
                              </th>
                              <td role="cell" className="text-body">
                                <CellLabel>Limits</CellLabel>
                                {limitsLine(route.facts)}
                              </td>
                              <td role="cell" className="text-small">
                                <CellLabel>Checks</CellLabel>
                                {`You ${route.facts.checks.you} · Employer ${route.facts.checks.employer} · Authority ${route.facts.checks.authority}`}
                              </td>
                              <td role="cell" className="text-small">
                                <CellLabel>Verified</CellLabel>
                                {route.verifiedOn ? formatDate(route.verifiedOn) : "Not yet"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
