import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Wordmark } from "./brand";

export function SiteHeader() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  }

  const linkClass =
    "rounded-sm px-1 py-1 text-small text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="border-b border-border bg-background print:hidden">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="text-subhead text-foreground">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/check" className={linkClass} activeProps={{ className: "text-foreground" }}>
            Check
          </Link>
          <Link to="/routes" className={linkClass} activeProps={{ className: "text-foreground" }}>
            Routes
          </Link>
          <Link to="/changes" className={linkClass} activeProps={{ className: "text-foreground" }}>
            Changes
          </Link>
          <Link
            to="/methodology"
            className={linkClass}
            activeProps={{ className: "text-foreground" }}
          >
            Methodology
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {isDark ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface print:hidden">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Wordmark className="text-foreground" />
        <p className="prose-measure mt-1 text-body text-muted-foreground">
          Work visa routes for new graduates, with every rule linked to its official source.
        </p>
        <p className="prose-measure text-body text-muted-foreground">
          Information, not legal advice. Rules change, so every rule links to its official source
          and shows when a person last verified it.
        </p>
      </div>
    </footer>
  );
}
