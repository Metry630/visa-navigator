import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { DESTINATIONS, getRoute, type Checker } from "@/engine";

export const Route = createFileRoute("/routes/$routeId")({
  loader: ({ params }) => {
    const detail = getRoute(params.routeId);
    if (!detail) throw notFound();
    return { detail };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Route not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const { detail } = loaderData;
    return {
      meta: [
        { title: `${detail.name}: requirements and sources` },
        { name: "description", content: detail.summary },
        { property: "og:title", content: `${detail.name}: requirements and sources` },
        { property: "og:description", content: detail.summary },
      ],
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
      <p className="text-sm text-muted-foreground">{destination?.name}</p>
      <h1 className="mt-1 text-3xl font-semibold">{detail.name}</h1>
      <p className="prose-measure mt-3 leading-relaxed text-muted-foreground">{detail.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <a
          href={detail.officialUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2"
        >
          Official page
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span className="sr-only">opens in a new tab</span>
        </a>
        <span className="text-muted-foreground">
          {detail.verifiedOn ? `Verified ${detail.verifiedOn}` : "Not yet verified"}
        </span>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Requirements</h2>
      <ul className="mt-4 space-y-6">
        {detail.requirements.map((req) => (
          <li key={req.id} className="rounded-lg border border-border bg-card p-5">
            <p className="leading-relaxed">{req.text}</p>
            <p className="mt-2 text-sm text-muted-foreground">{WHO_TEXT[req.who]}</p>
            {req.effective && (req.effective.from || req.effective.to) && (
              <p className="mt-1 text-sm text-muted-foreground">
                Applies {req.effective.from ? `from ${req.effective.from}` : ""}
                {req.effective.from && req.effective.to ? " " : ""}
                {req.effective.to ? `until ${req.effective.to}` : ""}
              </p>
            )}
            <div className="mt-4 space-y-4">
              {req.sources.map((s) => (
                <div key={s.url + s.quote}>
                  <blockquote className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-muted-foreground italic">
                    {s.quote}
                  </blockquote>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.publisher}. Checked {s.retrievedOn}.{" "}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      Source
                    </a>
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link to="/check" className="font-medium text-primary underline underline-offset-2">
          Check whether this route is open to you
        </Link>
      </p>
    </div>
  );
}
