import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visa Routes | Work visa routes for new graduates" },
      {
        name: "description",
        content: "Work visa routes for new graduates, with every rule linked to its official source.",
      },
      { property: "og:title", content: "Visa Routes | Work visa routes for new graduates" },
      {
        property: "og:description",
        content: "Work visa routes for new graduates, with every rule linked to its official source.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const STEPS = [
  {
    title: "Tell us the basics",
    body: "Your nationality, age, degree and a few other facts. Nothing is stored.",
  },
  {
    title: "See the routes",
    body: "Each visa route is marked open, dependent on an employer, or closed, with one sentence saying why.",
  },
  {
    title: "Work the checklist",
    body: "Every requirement says who checks it: you, the employer, or the authority.",
  },
];

function Home() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <h1 className="prose-measure text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        Which countries can you actually work in after graduating?
      </h1>
      <p className="prose-measure mt-5 text-lg leading-relaxed text-muted-foreground">
        Answer a few questions about yourself and see the work visa routes you qualify for today.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link to="/check">Check my options</Link>
        </Button>
      </div>

      <ol className="mt-16 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-lg border border-border bg-card p-5">
            <span className="font-serif text-sm text-muted-foreground">Step {i + 1}</span>
            <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="prose-measure mt-14 space-y-2 border-t border-border pt-8 text-sm text-muted-foreground">
        <p>Singapore and Japan today. More countries are being added.</p>
        <p>
          Every rule links to an official source, and a person checks each one
          against it.
        </p>
      </div>
    </div>
  );
}
