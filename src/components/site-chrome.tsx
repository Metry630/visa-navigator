import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  const linkClass =
    "rounded-sm px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="border-b border-border bg-background print:hidden">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Visa Routes
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5">
          <Link to="/check" className={linkClass} activeProps={{ className: "text-foreground" }}>
            Check
          </Link>
          <Link to="/routes" className={linkClass} activeProps={{ className: "text-foreground" }}>
            Routes
          </Link>
          <Link
            to="/methodology"
            className={linkClass}
            activeProps={{ className: "text-foreground" }}
          >
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface print:hidden">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <p className="font-serif font-semibold text-foreground">Visa Routes</p>
        <p className="prose-measure mt-1 text-sm leading-relaxed text-muted-foreground">
          Work visa routes for new graduates, with every rule linked to its official source.
        </p>
        <p className="prose-measure text-sm leading-relaxed text-muted-foreground">
          Information, not legal advice. Rules change, so every rule links to its official source and
          shows when a person last verified it.
        </p>
      </div>
    </footer>
  );
}
