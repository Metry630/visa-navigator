import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  decodeProfile,
  evaluate,
  listNationalities,
  type Checker,
  type Profile,
  type RouteResult,
} from "@/engine";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
                    <div className="mt-1 flex flex-col gap-1">
                      {item.sources.map((s) => (
                        <SourceLink key={s.url + s.quote} source={s} />
                      ))}
                    </div>
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
          <StatusBadge status={route.status} />
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
          const open = destination.routes.filter((route) => route.status === "open").length;
          const depends = destination.routes.filter((route) => route.status === "depends").length;
          const closed = destination.routes.filter((route) => route.status === "closed").length;
          return (
            <p key={destination.destination}>
              <span className="font-medium text-foreground">{destination.name}:</span> {open} open,{
              " "
              }{depends} depend on an employer, {closed} closed.
            </p>
          );
        })}
      </div>

      <div className="mt-10 space-y-12">
        {sortedResults.map((destination) => (
          <section key={destination.destination}>
            <h2 className="text-2xl font-semibold">{destination.name}</h2>
            <div className="mt-4 space-y-5">
              {destination.routes.map((route) => (
                <RouteCard key={route.routeId} route={route} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
