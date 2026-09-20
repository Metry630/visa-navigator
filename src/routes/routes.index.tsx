import { createFileRoute } from "@tanstack/react-router";
import { formatDate } from "@/components/format-date";
import { SiteLink } from "@/components/links";
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
 * Every phrase here restates a value the engine already carries on `facts`, so the table can compare
 * routes without anyone writing a rule into the UI.
 *
 * An absent field means the route has no requirement of that kind in effect, so it contributes
 * nothing. It never becomes a dash or a "none in effect": only seven of the ten routes carry a limit
 * at all, and a filler phrase would read as missing data on the three that do not.
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

/** The non-zero counts only, so a route with nothing for an employer to do does not print a zero. */
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

/**
 * The visible label a cell needs below 40rem, where the header row is hidden.
 *
 * `aria-hidden`, because the association a screen reader uses comes from the header cells, which
 * survive the collapse thanks to the explicit roles on the table.
 */
function CellLabel({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="font-medium text-foreground sm:hidden">
      {children}:{" "}
    </span>
  );
}

const HEAD_CELL =
  "pb-3 text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase";

/**
 * The route library is a table so that two routes can be compared without scrolling between them.
 *
 * The four columns are the ones every route can fill. Age constrains four routes, degree two,
 * nationality lists two and salary floors two, so a column per limit would be three-quarters empty
 * and read as broken data. The limits sit under the route name instead, where a route without one
 * simply has its name standing alone.
 *
 * Every element carries an explicit ARIA role alongside `scope`. Below 40rem the stylesheet turns
 * the table into stacked blocks, and `display: block` on its own makes browsers drop the implicit
 * table, row and cell roles, which would leave every value unlabelled on a phone.
 */
function RouteTable({ routes, caption }: { routes: RouteSummary[]; caption: string }) {
  return (
    <table role="table" className="route-table mt-3 w-full text-left sm:table-fixed">
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader" className={`${HEAD_CELL} w-[42%]`}>
            Route
          </th>
          <th scope="col" role="columnheader" className={`${HEAD_CELL} w-[16%]`}>
            Who applies
          </th>
          <th scope="col" role="columnheader" className={`${HEAD_CELL} w-[20%]`}>
            What decides it
          </th>
          <th scope="col" role="columnheader" className={`${HEAD_CELL} w-[22%]`}>
            Verified
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {routes.map((route) => {
          const limits = limitsLine(route.facts);
          return (
            <tr key={route.routeId} role="row">
              <th scope="row" role="rowheader" className="text-left font-normal">
                <span className="text-subhead font-semibold">
                  <SiteLink
                    to="/routes/$routeId"
                    params={{ routeId: route.routeId }}
                    className="break-words"
                  >
                    {route.name}
                  </SiteLink>
                </span>
                {limits && (
                  <span className="mt-1 block text-small tabular-nums text-muted-foreground">
                    {limits}
                  </span>
                )}
                <span className="mt-1 block text-body text-muted-foreground">{route.summary}</span>
              </th>
              <td role="cell" className="text-body">
                <CellLabel>Who applies</CellLabel>
                {route.requiresEmployer ? "An employer" : "You"}
              </td>
              <td role="cell" className="text-body tabular-nums">
                <CellLabel>What decides it</CellLabel>
                {checksLine(route.facts.checks)}
              </td>
              <td role="cell" className="text-body tabular-nums text-muted-foreground">
                <CellLabel>Verified</CellLabel>
                {route.verifiedOn ? formatDate(route.verifiedOn) : "Not yet"}
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
                {groups.map((group) =>
                  group.routes.length === 0 ? null : (
                    <section key={group.title}>
                      <h3 className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        {group.title} ({group.routes.length})
                      </h3>
                      <RouteTable
                        routes={group.routes}
                        caption={`${destination.name}: ${group.title}`}
                      />
                    </section>
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
