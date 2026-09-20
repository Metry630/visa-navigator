import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DESTINATIONS, getRoute, type Checker } from "@/engine";
import { EvidenceQuote } from "@/components/evidence-quote";
import { formatDate } from "@/components/format-date";
import { OutboundLink, SiteLink } from "@/components/links";

export const Route = createFileRoute("/routes/$routeId")({
  loader: ({ params }) => {
    const detail = getRoute(params.routeId);
    if (!detail) throw notFound();
    return { detail };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Route not found | Visa Routes" },
          { name: "description", content: "This route could not be found on Visa Routes." },
          { property: "og:title", content: "Route not found | Visa Routes" },
          { property: "og:description", content: "This route could not be found on Visa Routes." },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { detail } = loaderData;
    return {
      meta: [
        { title: `${detail.name}: requirements and sources | Visa Routes` },
        { name: "description", content: detail.summary },
        { property: "og:title", content: `${detail.name}: requirements and sources | Visa Routes` },
        { property: "og:description", content: detail.summary },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/routes/${detail.routeId}` },
      ],
      links: [{ rel: "canonical", href: `/routes/${detail.routeId}` }],
    };
  },
  component: RouteDetailPage,
});

const WHO_TEXT: Record<Checker, string> = {
  you: "You check this",
  employer: "The employer checks this",
  authority: "The authority decides this",
};

function RouteDetailPage() {
  const { detail } = Route.useLoaderData();
  const destination = DESTINATIONS.find((d) => d.code === detail.destination);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-small text-muted-foreground">{destination?.name}</p>
      <h1 className="mt-1 text-title font-semibold">{detail.name}</h1>
      <p className="prose-measure mt-3 text-body text-muted-foreground">{detail.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-small">
        <OutboundLink href={detail.officialUrl}>
          Official page on {new URL(detail.officialUrl).hostname.replace(/^www\./, "")}
        </OutboundLink>
        {detail.requirements.some((requirement) => requirement.who === "employer") && (
          <SiteLink to="/pack" search={{ route: detail.routeId }}>
            What an employer has to do for this route
          </SiteLink>
        )}
        <span className="text-muted-foreground">
          {detail.verifiedOn ? `Verified ${formatDate(detail.verifiedOn)}` : "Not yet verified"}
        </span>
      </div>

      <h2 className="mt-10 text-section font-semibold">Requirements</h2>
      <ul className="mt-4 space-y-6">
        {detail.requirements.map((req) => (
          <li key={req.id} className="rounded-lg border border-border bg-card p-5">
            <p className="text-body">{req.text}</p>
            <p className="mt-2 text-small text-muted-foreground">{WHO_TEXT[req.who]}</p>
            {req.effective && (req.effective.from || req.effective.to) && (
              <p className="mt-1 text-small text-muted-foreground">
                Applies {req.effective.from ? `from ${formatDate(req.effective.from)}` : ""}
                {req.effective.from && req.effective.to ? " " : ""}
                {req.effective.to ? `until ${formatDate(req.effective.to)}` : ""}
              </p>
            )}
            <div className="mt-4 space-y-4">
              {req.sources.map((s) => (
                <div key={s.url + s.quote}>
                  <EvidenceQuote quote={s.quote} translation={s.translation} />
                  <p className="mt-2 text-caption text-muted-foreground">
                    <OutboundLink href={s.url}>{s.publisher}</OutboundLink> · Retrieved{" "}
                    {formatDate(s.retrievedOn)}
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-body">
        <SiteLink to="/check">
          Check whether this route is open to you
        </SiteLink>
      </p>
    </div>
  );
}
