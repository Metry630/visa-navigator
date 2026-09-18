import { Check, CircleHelp, ExternalLink, X } from "lucide-react";
import type { Checker, Outcome, RouteStatus, Source } from "@/engine";
import { formatDate } from "@/components/format-date";

const STATUS_TEXT: Record<RouteStatus, string> = {
  open: "Open",
  depends: "Depends on employer",
  closed: "Closed",
};

const STATUS_CLASS: Record<RouteStatus, string> = {
  open: "bg-open text-open-foreground",
  depends: "bg-depends text-depends-foreground",
  closed: "bg-closed text-closed-foreground",
};

export function StatusBadge({ status }: { status: RouteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {STATUS_TEXT[status]}
    </span>
  );
}

export const CHECKER_HEADING: Record<Checker, string> = {
  you: "You can check now",
  employer: "Ask the employer",
  authority: "The authority decides",
};

const OUTCOME_TEXT: Record<Outcome, string> = {
  met: "Met",
  unmet: "Not met",
  unknown: "Unknown",
};

export function OutcomeTag({ outcome }: { outcome: Outcome }) {
  const Icon = outcome === "met" ? Check : outcome === "unmet" ? X : CircleHelp;
  const color =
    outcome === "met"
      ? "text-open-foreground"
      : outcome === "unmet"
        ? "text-closed-foreground"
        : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon aria-hidden="true" className="size-3.5" />
      {OUTCOME_TEXT[outcome]}
    </span>
  );
}

export function SourceLink({ source }: { source: Source }) {
  return (
    <span className="block min-w-0">
      <span className="block border-l-2 border-primary pl-3 text-sm leading-relaxed text-muted-foreground italic">
        {source.quote}
      </span>
      {source.translation && (
        <span className="mt-2 block border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
          <span className="mb-1 block text-xs font-medium not-italic">unofficial translation</span>
          {source.translation}
        </span>
      )}
      <span className="mt-2 inline-flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline underline-offset-2"
        >
          Source
          <ExternalLink aria-hidden="true" className="size-3" />
          <span className="sr-only">opens in a new tab</span>
        </a>
        <span>
          {source.publisher}. Retrieved {formatDate(source.retrievedOn)}
        </span>
      </span>
    </span>
  );
}
