import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  decodeProfile,
  encodeProfile,
  evaluate,
  listNationalities,
  listRoutes,
  type Checker,
  type Destination,
  type Insight,
  type Profile,
  type RouteFacts,
  type RouteResult,
} from "@/engine";
import { CHECKER_HEADING, OutcomeTag, StatusBadge } from "@/components/route-ui";
import { formatDate } from "@/components/format-date";
import { SiteLink } from "@/components/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const SALARY_UNITS: Record<Destination, string> = {
  SG: "SGD per month",
  JP: "JPY per year",
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
  ];
  if (profile.yearsExperience > 0) bits.push(`${profile.yearsExperience} years of experience`);
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
      <p className="min-w-0 text-small text-muted-foreground">{bits.join(" · ")}</p>
      <SiteLink to="/check" className="shrink-0 py-2 text-small">
        Edit answers
      </SiteLink>
    </div>
  );
}

function Insights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-subhead font-semibold">What the rules mean for you</h3>
      <ul className="mt-3 divide-y divide-border border-y border-border">
        {insights.map((insight) => (
          <li key={insight.id} className="py-4">
            <p className="prose-measure text-body">{insight.text}</p>
            <details className="group mt-2">
              <summary className="min-h-11 cursor-pointer list-none rounded-sm py-2 text-small font-medium text-primary underline underline-offset-2 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Where this comes from</span>
                <span className="hidden group-open:inline">Hide the rules</span>
              </summary>
              <ul className="mt-1 space-y-2 border-l-2 border-border pl-4 text-small">
                {insight.from.map((origin) => (
                  <li key={`${insight.id}-${origin.routeId}-${origin.requirementId}`}>
                    <SiteLink
                      to="/routes/$routeId"
                      params={{ routeId: origin.routeId }}
                      hash={origin.requirementId}
                      className="break-words"
                    >
                      {origin.requirementText}
                    </SiteLink>
                    <span className="text-muted-foreground"> · {origin.routeName}</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SalaryPrompt({
  profile,
  destination,
  destinationName,
  count,
}: {
  profile: Profile;
  destination: Destination;
  destinationName: string;
  count: number;
}) {
  const navigate = useNavigate();
  const [salary, setSalary] = useState("");
  const fieldId = `salary-${destination}`;

  const addSalary = () => {
    const amount = Number(salary);
    if (!salary || !Number.isFinite(amount) || amount < 0) return;
    const updated: Profile = {
      ...profile,
      expectedSalary: { ...profile.expectedSalary, [destination]: amount },
    };
    void navigate({
      to: "/results",
      search: { p: encodeProfile(updated) },
      replace: true,
      resetScroll: false,
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end">
      <div className="w-full max-w-xs space-y-1">
        <label htmlFor={fieldId} className="block text-small font-medium">
          Expected salary in {destinationName}, {SALARY_UNITS[destination]}
        </label>
        <p className="text-caption text-muted-foreground">
          {count === 1 ? "This settles 1 rule." : `This settles ${count} rules.`}
        </p>
        <Input
          id={fieldId}
          className="h-10"
          type="number"
          min={0}
          inputMode="numeric"
          value={salary}
          onChange={(event) => setSalary(event.target.value)}
        />
      </div>
      <Button type="button" size="sm" onClick={addSalary} disabled={!salary}>
        Add salary
      </Button>
    </div>
  );
}

function ChecksLine({ facts }: { facts: RouteFacts | undefined }) {
  if (!facts) return null;
  return (
    <span className="text-caption text-muted-foreground tabular-nums">
      {facts.checks.you} for you · {facts.checks.employer} for an employer ·{" "}
      {facts.checks.authority} for the authority
    </span>
  );
}

function RouteChecklist({ route }: { route: RouteResult }) {
  return (
    <>
      {route.upcomingChanges.length > 0 && (
        <div className="mt-4 border-l-2 border-border pl-3">
          <h4 className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Upcoming changes
          </h4>
          <ul className="mt-1 space-y-1 text-small text-muted-foreground">
            {route.upcomingChanges.map((c) => (
              <li key={`${c.on}-${c.text}`}>
                <span className="font-medium text-foreground">{formatDate(c.on)}</span>: {c.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-5">
        {CHECKER_ORDER.map((who) => {
          const items = route.checklist.filter((item) => item.who === who);
          if (items.length === 0) return null;
          return (
            <section key={who}>
              <h4 className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {CHECKER_HEADING[who]}
              </h4>
              <ul className="mt-2 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.requirementId}
                    className="min-w-0 border-l-2 border-border pl-3 text-body"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <OutcomeTag outcome={item.outcome} />
                      <span className="min-w-0 break-words">{item.text}</span>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-small text-muted-foreground">{item.note}</p>
                    )}
                    <p className="mt-1 text-small">
                      <SiteLink
                        to="/routes/$routeId"
                        params={{ routeId: route.routeId }}
                        hash={item.requirementId}
                      >
                        Read the rule and its source
                      </SiteLink>
                    </p>
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

function RouteRow({
  route,
  facts,
  p,
  showReason,
}: {
  route: RouteResult;
  facts: RouteFacts | undefined;
  p: string;
  showReason: boolean;
}) {
  const hasEmployerItems = route.checklist.some((item) => item.who === "employer");
  return (
    <details className="group min-w-0 border-b border-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={route.status} requiresEmployer={route.requiresEmployer} />
            <span className="min-w-0 text-body font-medium break-words">{route.name}</span>
            {route.verifiedOn === null && (
              <span className="text-caption text-muted-foreground">Not yet verified</span>
            )}
          </div>
          <div className="mt-1">
            <ChecksLine facts={facts} />
          </div>
          {showReason && <p className="mt-1 text-small text-muted-foreground">{route.reason}</p>}
        </div>
        <ChevronDown
          aria-hidden="true"
          className="mt-2 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="pb-5">
        {!showReason && <p className="text-body text-muted-foreground">{route.reason}</p>}
        <RouteChecklist route={route} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SiteLink
            to="/routes/$routeId"
            params={{ routeId: route.routeId }}
            className="text-small"
          >
            Read the full route
          </SiteLink>
          {hasEmployerItems && (
            <Button asChild variant="outline" size="sm">
              <Link to="/pack" search={{ p, route: route.routeId }}>
                Employer pack
              </Link>
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}

function RouteGroup({
  title,
  routes,
  facts,
  p,
  showReason = false,
}: {
  title: string;
  routes: RouteResult[];
  facts: Map<string, RouteFacts>;
  p: string;
  showReason?: boolean;
}) {
  if (routes.length === 0) return null;
  return (
    <section className="mt-7">
      <h3 className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="mt-2 border-t border-border">
        {routes.map((route) => (
          <RouteRow
            key={route.routeId}
            route={route}
            facts={facts.get(route.routeId)}
            p={p}
            showReason={showReason}
          />
        ))}
      </div>
    </section>
  );
}

function NothingOpen({ name }: { name: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h3 className="text-subhead font-semibold">No route in {name} is open for these answers.</h3>
      <p className="prose-measure mt-2 text-body text-muted-foreground">
        Every route below is closed. Open a route to read the reason it gives, and the rule it comes
        from.
      </p>
      <ul className="prose-measure mt-3 space-y-2 text-body text-muted-foreground">
        <li>
          Rules change. A rule that closes a route today may not next January.{" "}
          <SiteLink to="/changes" className="hover:text-foreground">
            See what is changing
          </SiteLink>
          .
        </li>
        <li>
          You can read every rule without answering anything.{" "}
          <SiteLink to="/routes" className="hover:text-foreground">
            Read the routes
          </SiteLink>
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
  const factsById = useMemo(() => {
    const map = new Map<string, RouteFacts>();
    for (const summary of listRoutes()) map.set(summary.routeId, summary.facts);
    return map;
  }, []);
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

  const allRoutes = sortedResults.flatMap((destination) => destination.routes);
  const closedTotal = allRoutes.filter((route) => route.status === "closed").length;
  const activeTotal = allRoutes.filter((route) => route.status !== "closed");
  const employerTotal = activeTotal.filter((route) => route.requiresEmployer).length;
  const selfTotal = activeTotal.filter((route) => !route.requiresEmployer).length;

  const salaryNeeds = sortedResults
    .map((destination) => ({
      destination: destination.destination,
      name: destination.name,
      count: destination.routes.reduce(
        (total, route) =>
          total + route.checklist.filter((item) => item.missing === "expectedSalary").length,
        0,
      ),
    }))
    .filter((need) => need.count > 0);

  return (
    <div className="mx-auto min-w-0 max-w-4xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-title font-semibold">Your routes</h1>
      <p className="prose-measure mt-2 text-body text-muted-foreground">
        Based on the answers you gave. Read each official source before you act.
      </p>

      <p className="prose-measure mt-5 text-subhead">
        {selfTotal} {selfTotal === 1 ? "route" : "routes"} you can start yourself, {employerTotal}{" "}
        that need an employer, {closedTotal} closed.
      </p>

      <div className="mt-5 flex min-h-11 flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link to these results"}
        </Button>
        <span className="text-small text-muted-foreground" aria-live="polite">
          {copied ? "The link is ready to share." : ""}
        </span>
      </div>

      <div className="mt-5">
        <ProfileSummary profile={profile} />
      </div>

      {salaryNeeds.length > 0 && (
        <section className="mt-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-subhead font-semibold">Add the salary you expect</h2>
          <p className="prose-measure mt-1 text-small text-muted-foreground">
            Some rules turn on pay. Answer this and they stop reading as unknown.
          </p>
          <div className="mt-4 space-y-5">
            {salaryNeeds.map((need) => (
              <SalaryPrompt
                key={need.destination}
                profile={profile}
                destination={need.destination}
                destinationName={need.name}
                count={need.count}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-7 space-y-1 text-small text-muted-foreground">
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
          const openRoutes = destination.routes.filter((route) => route.status !== "closed");
          const closedRoutes = destination.routes.filter((route) => route.status === "closed");
          const selfRoutes = openRoutes.filter((route) => !route.requiresEmployer);
          const employerRoutes = openRoutes.filter((route) => route.requiresEmployer);
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
              <h2 className="text-section font-semibold">{destination.name}</h2>
              <Insights insights={destination.insights} />
              {allClosed && <NothingOpen name={destination.name} />}
              {groups.map((group) => (
                <RouteGroup
                  key={group.title}
                  title={group.title}
                  routes={group.routes}
                  facts={factsById}
                  p={p}
                />
              ))}
              <RouteGroup
                title="Closed for these answers"
                routes={closedRoutes}
                facts={factsById}
                p={p}
                showReason
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
