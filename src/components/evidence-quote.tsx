const LONG_QUOTE_LENGTH = 220;

function QuoteText({ text, translation = false }: { text: string; translation?: boolean }) {
  const quoteClass = translation
    ? "border-l-2 border-border pl-4 text-body text-muted-foreground"
    : "border-l-2 border-primary pl-4 font-serif text-body text-foreground";

  if (text.length <= LONG_QUOTE_LENGTH) {
    return translation ? (
      <p className={quoteClass}>{text}</p>
    ) : (
      <blockquote className={quoteClass}>{text}</blockquote>
    );
  }

  const opening = `${text.slice(0, LONG_QUOTE_LENGTH).trimEnd()}…`;

  return (
    <>
      <details className="group quote-disclosure print:hidden">
        <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
          <span className={`${quoteClass} quote-preview block`}>{opening}</span>
          <span className="quote-toggle mt-2 inline-block rounded-sm text-small font-medium text-primary underline underline-offset-2">
            <span className="group-open:hidden">Show the full quote</span>
            <span className="hidden group-open:inline">Hide the full quote</span>
          </span>
        </summary>
        {translation ? (
          <p className={`${quoteClass} quote-full mt-2`}>{text}</p>
        ) : (
          <blockquote className={`${quoteClass} quote-full mt-2`}>{text}</blockquote>
        )}
      </details>
      {translation ? (
        <p className={`${quoteClass} hidden print:block`}>{text}</p>
      ) : (
        <blockquote className={`${quoteClass} hidden print:block`}>{text}</blockquote>
      )}
    </>
  );
}

export function EvidenceQuote({
  quote,
  translation,
}: {
  quote: string;
  translation: string | undefined;
}) {
  return (
    <>
      <QuoteText text={quote} />
      {translation && (
        <div className="mt-2">
          <p className="mb-1 text-caption font-medium text-muted-foreground">
            unofficial translation
          </p>
          <QuoteText text={translation} translation />
        </div>
      )}
    </>
  );
}
