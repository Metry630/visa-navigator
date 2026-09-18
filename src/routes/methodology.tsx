import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology: how Visa Routes checks the rules | Visa Routes" },
      {
        name: "description",
        content:
          "Every rule on Visa Routes comes from an official government page, quotes its source, and is checked by a person.",
      },
      {
        property: "og:title",
        content: "Methodology: how Visa Routes checks the rules | Visa Routes",
      },
      {
        property: "og:description",
        content:
          "How rules are collected, quoted, translated, verified by hand and monitored for changes.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/methodology" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/methodology" }],
  }),
  component: Methodology,
});

const POINTS = [
  {
    title: "Official pages only",
    body: "Rules come only from government pages, such as the ministry or immigration agency that runs the route. Blogs, law firm summaries and news reports are not used.",
  },
  {
    title: "Every rule quotes its source",
    body: "Each requirement stores the page address, the publisher, the date it was retrieved, and a verbatim quote from the page.",
  },
  {
    title: "A person checks each rule",
    body: "A route is marked as verified only after a person has read every requirement against its source. Until then the route shows a Not yet verified label.",
  },
  {
    title: "Translations are reading aids",
    body: "Most Japan rules are quoted from Japanese government pages. Every non-English quote carries an unofficial literal English translation, with the original always shown as the evidence. A model never translates a rule into the requirement text itself.",
  },
  {
    title: "Weekly automated re-checks",
    body: "Every quote is re-fetched from its live page each week. When a quote has moved, an issue is opened for a person to re-read it. A page the checker cannot reach is reported separately and is not treated as a changed rule.",
  },
];

function Methodology() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-3xl font-semibold sm:text-4xl">How this works</h1>
      <p className="prose-measure mt-4 text-lg leading-relaxed text-muted-foreground">
        Visa Routes turns official immigration rules into plain checklists. Here is how the rules
        get here and how they stay current.
      </p>

      <div className="mt-10 space-y-8">
        {POINTS.map((point) => (
          <section key={point.title} className="prose-measure">
            <h2 className="text-xl font-semibold">{point.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{point.body}</p>
          </section>
        ))}
      </div>

      <section className="prose-measure mt-12 border-t border-border pt-8">
        <h2 className="text-xl font-semibold">Disclaimer</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          This site gives information, not legal advice. Rules change and individual cases differ.
          Always read the official page before you act, and speak to a qualified adviser if your
          case is complicated.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          <a
            href="https://github.com/Metry630/visa-navigator"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-primary underline underline-offset-2"
          >
            Read the source code
          </a>
        </p>
      </section>
    </div>
  );
}
