import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
};

export function BrandMark({ className }: BrandProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="m9 8 4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Wordmark({ className }: BrandProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.32em] whitespace-nowrap font-serif font-semibold tracking-tight",
        className,
      )}
    >
      <BrandMark className="h-[0.82em] w-[0.82em] shrink-0 self-center" />
      <span>Visa Routes</span>
    </span>
  );
}
