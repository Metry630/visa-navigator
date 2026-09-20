import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const LINK_CLASS = "rounded-sm font-medium text-primary underline underline-offset-2";

export function OutboundLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`${LINK_CLASS} inline-flex items-baseline gap-1`}
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3 shrink-0 self-center" />
      <span className="sr-only">opens in a new tab</span>
    </a>
  );
}

export function SiteLink({ className, ...props }: LinkComponentProps) {
  return <Link {...props} className={cn(LINK_CLASS, className)} />;
}
