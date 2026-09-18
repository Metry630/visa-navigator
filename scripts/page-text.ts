// Turns an official page into plain text the same way everywhere: when a quote is first copied
// (fetch-source.ts) and when it is re-checked against the live page (the drift check).

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code =
        e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** One block of visible text per line, scripts and styles removed. */
export function htmlToLines(html: string): string[] {
  const body = html
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?(p|div|li|ul|ol|h[1-6]|tr|table|section|article|header|footer|nav|dt|dd)\b[^>]*>/gi,
      "\n",
    )
    .replace(/<\/?(td|th)\b[^>]*>/gi, " | ");
  return (
    decodeEntities(body.replace(/<[^>]+>/g, " "))
      .split("\n")
      // \u00a0 is a non-breaking space, written as an escape because government pages are full of
      // them and an invisible character in a character class is a trap for the next reader.
      .map((l) => l.replace(/[ \t\u00a0]+/g, " ").replace(/^[\s|]+|[\s|]+$/g, ""))
      .filter(Boolean)
  );
}

/** Whitespace-insensitive form used to find a quote inside a page. */
export function normalise(text: string): string {
  return text
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\(\s+/g, "(")
    .trim();
}

export async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}
