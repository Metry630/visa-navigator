import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { decodeProfile, evaluate, type RouteResult } from "@/engine";
import { EvidenceQuote } from "@/components/evidence-quote";
import { formatDate } from "@/components/format-date";
import { Button } from "@/components/ui/button";
import { buildPackLink } from "@/lib/share-link";

type PackSearch = { p: string; route: string };

function findRoute(
  encoded: string,
  routeId: string,
): { route: RouteResult; destinationName: string } | null {
  const profile = decodeProfile(encoded);
  if (!profile) return null;
  for (const destination of evaluate(profile)) {
    const route = destination.routes.find((r) => r.routeId === routeId);
    if (route) return { route, destinationName: destination.name };
  }
  return null;
}

export const Route = createFileRoute("/pack")({
  validateSearch: (search: Record<string, unknown>): PackSearch => ({
    p: typeof search["p"] === "string" ? search["p"] : "",
    route: typeof search["route"] === "string" ? search["route"] : "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.p || !search.route || !findRoute(search.p, search.route)) {
      throw redirect({ to: "/check" });
    }
  },
  head: () => ({
    meta: [
      { title: "For your employer | Visa Routes" },
      {
        name: "description",
        content:
          "A one-page summary of what an employer has to confirm or provide for one work visa route, with a link to every official source.",
      },
      { property: "og:title", content: "For your employer | Visa Routes" },
      {
        property: "og:description",
        content:
          "A one-page summary of what an employer has to confirm or provide for one work visa route, with a link to every official source.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PackPage,
});

function PackPage() {
  const { p, route: routeId } = Route.useSearch();
  const [copied, setCopied] = useState(false);
  const found = useMemo(() => findRoute(p, routeId), [p, routeId]);

  if (!found) return null;
  const { route, destinationName } = found;
  const employerItems = route.checklist.filter((item) => item.who === "employer");

  const copyLink = async () => {
    await navigator.clipboard.writeText(buildPackLink(p, routeId));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pack-print mx-auto min-w-0 max-w-3xl px-4 py-10 sm:px-5 sm:py-12">
      <p className="text-sm text-muted-foreground">{destinationName}</p>
      <h1 className="mt-1 text-3xl font-semibold">{route.name}</h1>
      <p className="prose-measure mt-3 leading-relaxed">
        This page lists only the points an employer has to confirm, provide or agree to for this one
        route, for one candidate. Each point is followed by the official wording it comes from and a
        link to the page it was taken from.
      </p>

      <div className="mt-5 flex min-h-11 flex-wrap items-center gap-3 print:hidden">
        <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {copied ? "The link is ready to share." : ""}
        </span>
      </div>

      <h2 className="mt-10 text-xl font-semibold">What the employer is asked for</h2>
      {employerItems.length === 0 ? (
        <p className="prose-measure mt-3 leading-relaxed text-muted-foreground">
          There is nothing on this route for an employer to confirm.
        </p>
      ) : (
        <ul className="mt-4 space-y-6">
          {employerItems.map((item) => (
            <li
              key={item.requirementId}
              className="pack-item min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <p className="leading-relaxed">{item.text}</p>
              {item.note && <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>}
              <div className="mt-4 space-y-4">
                {item.sources.map((s) => (
                  <div key={s.url + s.quote}>
                    <EvidenceQuote quote={s.quote} translation={s.translation} />
                    <p className="mt-2 text-xs break-words text-muted-foreground">
                      {s.publisher}. Retrieved {formatDate(s.retrievedOn)}.{" "}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        Source
                      </a>
                      <span className="hidden print:inline"> {s.url}</span>
                    </p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="prose-measure mt-10 space-y-2 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          What this page cannot tell you: it does not say whether an application will be approved.
          That decision belongs to the authority.
        </p>
        <p>
          It is information, not legal advice. Read each official source before you act, and check
          the date each source was retrieved.
        </p>
        <p>
          {route.verifiedOn
            ? `A person last checked this route against its sources on ${formatDate(route.verifiedOn)}.`
            : "Not yet verified: nobody has checked this route against its sources yet."}
        </p>
      </div>

      <p className="mt-8 text-sm print:hidden">
        <Link
          to="/results"
          search={{ p }}
          className="font-medium text-primary underline underline-offset-2"
        >
          Back to the candidate's results
        </Link>
      </p>
    </div>
  );
}
