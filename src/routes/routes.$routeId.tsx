import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  DESTINATIONS,
  formatMoney,
  getRoute,
  listNationalities,
  type Checker,
  type RequirementRule,
} from "@/engine";
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

const COUNTRY_NAMES = new Map(listNationalities().map((country) => [country.code, country.name]));

function sectorLabel(sector: string): string {
  if (sector === "all-except-financial-services") return "All sectors except financial services";
  return sector
    .split("-")
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function RuleDetails({ rule }: { rule: RequirementRule }) {
  if (rule.kind === "salary-floor") {
    const lastIndex = rule.byAge.length - 1;
    const period = rule.period === "month" ? "monthly" : "yearly";

    return (
      <div className="mt-4">
        <p className="text-caption text-muted-foreground">
          {sectorLabel(rule.sector)}, {period}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 border-y border-border py-3 text-small tabular-nums sm:grid-cols-3 lg:grid-cols-4">
          {rule.byAge.map(({ age, amount }, index) => (
            <div key={age} className="flex min-w-0 justify-between gap-3">
              <dt className="text-muted-foreground">
                {index === 0 ? `${age} or below` : index === lastIndex ? `${age} or above` : age}
              </dt>
              <dd className="font-medium">{formatMoney(amount, rule.currency)}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (rule.kind === "nationality-list") {
    return (
      <div className="mt-4 text-small">
        <p className="font-medium">{rule.listName}</p>
        <p className="mt-1 text-muted-foreground">
          {rule.codes.map((code) => COUNTRY_NAMES.get(code) ?? code).join(", ")}
        </p>
      </div>
    );
  }

  return null;
}

function RouteDetailPage() {
  const { detail } = Route.useLoaderData();
  const destination = DESTINATIONS.find((d) => d.code === detail.destination);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:max-w-5xl">
      <p className="text-small text-muted-foreground">{destination?.name}</p>
      <h1 className="mt-1 text-title font-semibold">{detail.name}</h1>
      <p className="prose-measure mt-3 text-body text-muted-foreground">{detail.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-small">
        <OutboundLink href={detail.officialUrl}>
          Official page on {new URL(detail.officialUrl).hostname.replace(/^www\./, "")}
        </OutboundLink>
        {detail.requirements.some((requirement) => requirement.who === "employer") && (
          <SiteLink to="/pack" search={{ route: detail.routeId }}>
            Employer checklist
          </SiteLink>
        )}
        <span className="text-muted-foreground">
          {detail.verifiedOn ? `Verified ${formatDate(detail.verifiedOn)}` : "Not yet verified"}
        </span>
      </div>

      <h2 className="mt-10 text-section font-semibold">Requirements</h2>
      <ul className="mt-4 border-t border-border">
        {detail.requirements.map((req, index) => (
          <li
            key={req.id}
            id={req.id}
            className="grid scroll-mt-6 grid-cols-1 gap-x-6 border-b border-border py-6 md:grid-cols-[10rem_minmax(0,68ch)]"
          >
            <a
              href={`#${req.id}`}
              aria-label={`Requirement ${index + 1}`}
              className="w-fit rounded-sm text-caption tabular-nums text-muted-foreground"
            >
              {index + 1}
            </a>
            <div className="mt-2 min-w-0 md:mt-0">
              <p className="text-body">{req.text}</p>
              <RuleDetails rule={req.rule} />
            </div>
            <div className="mt-2 text-caption text-muted-foreground md:mt-3">
              <p>{WHO_TEXT[req.who]}</p>
              {req.effective && (req.effective.from || req.effective.to) && (
                <p className="mt-1">
                  Applies {req.effective.from ? `from ${formatDate(req.effective.from)}` : ""}
                  {req.effective.from && req.effective.to ? " " : ""}
                  {req.effective.to ? `until ${formatDate(req.effective.to)}` : ""}
                </p>
              )}
            </div>
            <div className="mt-4 min-w-0 space-y-4 md:mt-3">
              {req.sources.map((s) => (
                <div key={s.url + s.quote}>
                  <EvidenceQuote quote={s.quote} translation={s.translation} collapsed />
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
        <SiteLink to="/check">Check if this is open to you</SiteLink>
      </p>
    </div>
  );
}
