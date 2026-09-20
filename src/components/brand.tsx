import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
};

export function BrandMark({ className }: BrandProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <g transform="rotate(-10 12 12)">
        <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
        <line
          x1="7"
          y1="12"
          x2="17"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="butt"
        />
      </g>
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
