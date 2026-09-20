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
          <span className="quote-toggle mt-2 inline-block rounded-sm text-small font-medium text-primary underline-offset-2 underline">
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
  collapsed = false,
}: {
  quote: string;
  translation: string | undefined;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <>
        <details className="group quote-disclosure print:hidden">
          <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="quote-toggle inline-block rounded-sm text-small font-medium text-primary underline underline-offset-2">
              Official wording
            </span>
          </summary>
          <div className="mt-3 space-y-3">
            {translation && (
              <div>
                <p className="mb-1 text-caption font-medium text-muted-foreground">
                  unofficial translation
                </p>
                <p className="quote-full border-l-2 border-border pl-4 text-body text-muted-foreground">
                  {translation}
                </p>
              </div>
            )}
            <blockquote className="quote-full border-l-2 border-primary pl-4 font-serif text-body text-foreground">
              {quote}
            </blockquote>
          </div>
        </details>
        {translation && (
          <div className="hidden print:block">
            <p className="mb-1 text-caption font-medium text-muted-foreground">
              unofficial translation
            </p>
            <p className="border-l-2 border-border pl-4 text-body text-muted-foreground">
              {translation}
            </p>
          </div>
        )}
        <blockquote className="hidden border-l-2 border-primary pl-4 font-serif text-body text-foreground print:block">
          {quote}
        </blockquote>
      </>
    );
  }

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
