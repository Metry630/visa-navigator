import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDate } from "@/components/format-date";
import { DESTINATIONS, listRoutes } from "@/engine";

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

function RoutesLibrary() {
  const routes = listRoutes();

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-3xl font-semibold sm:text-4xl">Routes covered</h1>
      <p className="prose-measure mt-4 text-lg leading-relaxed text-muted-foreground">
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
              <h2 className="text-2xl font-semibold">{destination.name}</h2>
              <div className="mt-6 space-y-8">
                {groups.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-base font-semibold">
                      {group.title} <span className="text-muted-foreground">({group.routes.length})</span>
                    </h3>
                    <ul className="mt-3 divide-y divide-border border-y border-border">
                      {group.routes.map((route) => (
                        <li key={route.routeId} className="py-5">
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                            <h4 className="min-w-0 text-xl font-semibold">
                              <Link
                                to="/routes/$routeId"
                                params={{ routeId: route.routeId }}
                                className="break-words underline-offset-4 hover:underline"
                              >
                                {route.name}
                              </Link>
                            </h4>
                            <p className="shrink-0 text-sm text-muted-foreground">
                              {route.verifiedOn
                                ? `Verified ${formatDate(route.verifiedOn)}`
                                : "Not yet verified"}
                            </p>
                          </div>
                          <p className="prose-measure mt-2 leading-relaxed text-muted-foreground">
                            {route.summary}
                          </p>
                        </li>
                      ))}
                    </ul>
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
