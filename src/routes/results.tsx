import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  decodeProfile,
  evaluate,
  listNationalities,
  type Checker,
  type Insight,
  type Profile,
  type RouteResult,
} from "@/engine";
import { EvidenceQuote } from "@/components/evidence-quote";
import { CHECKER_HEADING, OutcomeTag, SourceLink, StatusBadge } from "@/components/route-ui";
import { formatDate } from "@/components/format-date";
import { Button } from "@/components/ui/button";
import { buildShareLink } from "@/lib/share-link";

type ResultsSearch = { p: string };

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): ResultsSearch => ({
    p: typeof search["p"] === "string" ? search["p"] : "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.p || !decodeProfile(search.p)) {
      throw redirect({ to: "/check" });
    }
  },
  head: () => ({
    meta: [
      { title: "Your work visa routes | Visa Routes" },
      {
        name: "description",
        content:
          "Your work visa routes in Singapore and Japan, with a checklist for each route and a link to every official rule.",
      },
      { property: "og:title", content: "Your work visa routes | Visa Routes" },
      {
        property: "og:description",
        content: "Routes marked open, dependent on an employer, or closed, with official sources.",
      },
    ],
  }),
  component: Results,
});

const CHECKER_ORDER: Checker[] = ["employer", "you", "authority"];
const STATUS_ORDER: Record<RouteResult["status"], number> = {
  open: 0,
  depends: 1,
  closed: 2,
};

function displayDegree(degree: Profile["degree"]): string {
  return degree.charAt(0).toUpperCase() + degree.slice(1);
}

function ProfileSummary({ profile }: { profile: Profile }) {
  const names = listNationalities();
  const bits = [
    profile.nationalities
      .map((code) => names.find((n) => n.code === code)?.name ?? code)
      .join(" and "),
    `age ${profile.age}`,
    displayDegree(profile.degree),
    `${profile.yearsExperience} years of experience`,
  ];
  if (profile.field) bits.push(profile.field);
  if (profile.graduationYear) bits.push(`graduated ${profile.graduationYear}`);
  const universityCountryName = names.find(
    (country) => country.code === profile.universityCountry,
  )?.name;
  if (universityCountryName) bits.push(`university in ${universityCountryName}`);
  if (profile.hasOffer !== undefined) {
    bits.push(profile.hasOffer ? "has a job offer" : "no job offer yet");
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex sm:flex-wrap sm:justify-between">
      <p className="min-w-0 text-sm text-muted-foreground">{bits.join(" · ")}</p>
      <Link
        to="/check"
        className="shrink-0 rounded-sm py-2 text-sm font-medium text-primary underline underline-offset-2"
      >
        Edit answers
      </Link>
    </div>
  );
}

function Insights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold">What the rules mean for you</h3>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {insights.map((insight) => (
          <li key={insight.id} className="py-4">
            <p className="prose-measure leading-relaxed">{insight.text}</p>
            <details className="group mt-3">
              <summary className="min-h-11 cursor-pointer list-none rounded-sm py-2 text-sm font-medium text-primary underline underline-offset-2 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Where this comes from</span>
                <span className="hidden group-open:inline">Hide the evidence</span>
              </summary>
              <div className="mt-2 space-y-5 border-l-2 border-border pl-4">
                {insight.from.map((origin) => (
                  <section key={`${insight.id}-${origin.routeId}-${origin.requirementId}`}>
                    <p className="text-sm leading-relaxed">{origin.requirementText}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Link
                        to="/routes/$routeId"
                        params={{ routeId: origin.routeId }}
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        {origin.routeName}
                      </Link>
                    </p>
                    <div className="mt-3 space-y-4">
                      {origin.sources.map((source) => (
                        <div key={source.url + source.quote}>
                          <EvidenceQuote quote={source.quote} translation={source.translation} />
                          <div className="mt-2">
                            <SourceLink source={source} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RouteGroup({ title, routes, p }: { title: string; routes: RouteResult[]; p: string }) {
  if (routes.length === 0) return null;
  return (
    <section className="mt-7">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-3 space-y-5">
        {routes.map((route) => (
          <RouteCard key={route.routeId} route={route} p={p} />
        ))}
      </div>
    </section>
  );
}

function EmployerPackLink({ route, p }: { route: RouteResult; p: string }) {
  if (!route.checklist.some((item) => item.who === "employer")) return null;
  return (
    <p className="mt-5 text-sm">
      <Link
        to="/pack"
        search={{ p, route: route.routeId }}
        className="inline-block rounded-sm py-1 text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Send this to your employer
      </Link>
    </p>
  );
}

function RouteChecklist({ route }: { route: RouteResult }) {
  return (
    <>
      {route.upcomingChanges.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-surface p-3">
          <h4 className="text-sm font-semibold">Upcoming changes</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {route.upcomingChanges.map((c) => (
              <li key={`${c.on}-${c.text}`}>
                <span className="font-medium text-foreground">{formatDate(c.on)}</span>: {c.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {CHECKER_ORDER.map((who) => {
          const items = route.checklist.filter((item) => item.who === who);
          if (items.length === 0) return null;
          return (
            <section key={who}>
              <h4
                className={
                  who === "employer"
                    ? "text-base font-semibold tracking-wide uppercase"
                    : "text-sm font-semibold tracking-wide uppercase"
                }
              >
                {CHECKER_HEADING[who]}
              </h4>
              <ul className="mt-2 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.requirementId}
                    className="min-w-0 border-l-2 border-border pl-3 text-sm leading-relaxed"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <OutcomeTag outcome={item.outcome} />
                      <span className="min-w-0 break-words">{item.text}</span>
                    </div>
                    {item.note && <p className="mt-1 text-muted-foreground">{item.note}</p>}
                    {item.sources.length > 0 && (
                      <details className="group mt-1 text-xs text-muted-foreground">
                        <summary className="cursor-pointer list-none rounded-sm py-1 underline underline-offset-2 marker:content-none [&::-webkit-details-marker]:hidden">
                          {item.sources.length} {item.sources.length === 1 ? "source" : "sources"} {"·"}
                          {[...new Set(item.sources.map((source) => source.publisher))].join(", ")} ·
                          read{" "}
                          {formatDate(
                            item.sources.reduce<string>(
                              (latest, source) =>
                                source.retrievedOn > latest ? source.retrievedOn : latest,
                              "",
                            ),
                          )}
                        </summary>
                        <div className="mt-1 flex flex-col gap-1 pl-3">
                          {item.sources.map((source) => (
                            <SourceLink key={source.url + source.quote} source={source} />
                          ))}
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function RouteHeading({ route }: { route: RouteResult }) {
  return (
    <>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <h3 className="min-w-0 text-xl font-semibold">
          <Link
            to="/routes/$routeId"
            params={{ routeId: route.routeId }}
            className="break-words underline-offset-4 hover:underline"
          >
            {route.name}
          </Link>
        </h3>
        <div className="col-span-full flex min-w-0 flex-wrap items-center gap-2 sm:col-span-1 sm:shrink-0">
          <StatusBadge status={route.status} requiresEmployer={route.requiresEmployer} />
          {route.verifiedOn === null && (
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              Not yet verified
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 leading-relaxed text-muted-foreground">{route.reason}</p>
    </>
  );
}

function RouteCard({ route, p }: { route: RouteResult; p: string }) {
  if (route.status === "closed") {
    return (
      <details className="group min-w-0 rounded-lg border border-border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 p-4 marker:content-none sm:p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <RouteHeading route={route} />
          </div>
          <ChevronDown
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-border px-4 pb-4 sm:px-5 sm:pb-5">
          <RouteChecklist route={route} />
          <EmployerPackLink route={route} p={p} />
        </div>
      </details>
    );
  }

  return (
    <article className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
      <RouteHeading route={route} />
      <RouteChecklist route={route} />
      <EmployerPackLink route={route} p={p} />
    </article>
  );
}

function NothingOpen({ name }: { name: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h3 className="text-base font-semibold">No route in {name} is open for these answers.</h3>
      <p className="prose-measure mt-2 text-sm text-muted-foreground">
        Every route below is closed. Open a route to read the reason it gives, and the rule it comes
        from.
      </p>
      <ul className="prose-measure mt-3 space-y-2 text-sm text-muted-foreground">
        <li>
          Rules change. A rule that closes a route today may not next January.{" "}
          <Link
            to="/changes"
            className="rounded-sm text-primary underline underline-offset-2 hover:text-foreground"
          >
            See what is changing
          </Link>
          .
        </li>
        <li>
          You can read every rule without answering anything.{" "}
          <Link
            to="/routes"
            className="rounded-sm text-primary underline underline-offset-2 hover:text-foreground"
          >
            Read the routes
          </Link>
          .
        </li>
      </ul>
    </div>
  );
}

function Results() {
  const { p } = Route.useSearch();
  const [copied, setCopied] = useState(false);
  const profile = useMemo(() => decodeProfile(p), [p]);
  const results = useMemo(() => (profile ? evaluate(profile) : []), [profile]);
  const sortedResults = useMemo(
    () =>
      results.map((destination) => ({
        ...destination,
        routes: [...destination.routes].sort(
          (first, second) => STATUS_ORDER[first.status] - STATUS_ORDER[second.status],
        ),
      })),
    [results],
  );

  if (!profile) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(buildShareLink(p));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto min-w-0 max-w-4xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-3xl font-semibold">Your routes</h1>
      <p className="prose-measure mt-2 text-sm text-muted-foreground">
        Based on the answers you gave. Read each official source before you act.
      </p>

      <div className="mt-5 flex min-h-11 flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {copied ? "The link is ready to share." : ""}
        </span>
      </div>

      <div className="mt-5">
        <ProfileSummary profile={profile} />
      </div>

      <div className="mt-7 space-y-1 text-sm text-muted-foreground">
        {sortedResults.map((destination) => {
          const closed = destination.routes.filter((route) => route.status === "closed").length;
          const activeRoutes = destination.routes.filter((route) => route.status !== "closed");
          const employer = activeRoutes.filter((route) => route.requiresEmployer).length;
          const self = activeRoutes.filter((route) => !route.requiresEmployer).length;
          return (
            <p key={destination.destination}>
              <span className="font-medium text-foreground">{destination.name}:</span> {employer}{" "}
              need an employer, {self} you can apply for yourself, {closed} closed.
            </p>
          );
        })}
      </div>

      <div className="mt-10 space-y-12">
        {sortedResults.map((destination) => {
          if (destination.routes.length === 0) return null;
          const allClosed = destination.routes.every((route) => route.status === "closed");
          const selfRoutes = destination.routes.filter((route) => !route.requiresEmployer);
          const employerRoutes = destination.routes.filter((route) => route.requiresEmployer);
          const groups = profile.hasOffer
            ? [
                { title: "Routes an employer has to apply for", routes: employerRoutes },
                { title: "Routes you can apply for yourself", routes: selfRoutes },
              ]
            : [
                { title: "Routes you can apply for yourself", routes: selfRoutes },
                { title: "Routes an employer has to apply for", routes: employerRoutes },
              ];
          return (
            <section key={destination.destination}>
              <h2 className="text-2xl font-semibold">{destination.name}</h2>
              <Insights insights={destination.insights} />
              {allClosed && <NothingOpen name={destination.name} />}
              {groups.map((group) => (
                <RouteGroup key={group.title} title={group.title} routes={group.routes} p={p} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
