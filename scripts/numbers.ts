// The figures a requirement puts in front of a user, pulled out the same way by the grounding check
// (check-data.ts) and by the review page, so the two always agree on what counts as "in the quote".
//
// Japanese official pages write digits full width: the ISA page says カテゴリー３, ＣＥＦＲ・Ｂ２,
// ４００点. An English requirement sentence writes the same figures in ASCII, so without folding the
// two forms together a JP route could never ground a single number against its own source.
//
// Numbers written as kanji (十年, 三年) are not read here. A requirement quoting those spells the
// figure out in words, and the reviewer checks it by eye against the quote.

const DIGITS = "0-9０-９"; // 0-9 and ０-９
const SEPARATORS = ",，"; // , and ，
const POINTS = ".．"; // . and ．

/** One number: digits, optional thousands separators, optional decimal part. */
const numberPattern = `[${DIGITS}](?:[${DIGITS}${SEPARATORS}]*[${DIGITS}])?(?:[${POINTS}][${DIGITS}]+)?`;

/** Full-width digits, commas and points to their ASCII forms; everything else is left alone. */
export function toAsciiDigits(text: string): string {
  return text.replace(new RegExp(`[０-９，．]`, "g"), (c) => {
    const code = c.charCodeAt(0);
    if (code >= 0xff10 && code <= 0xff19) return String(code - 0xff10);
    return c === "，" ? "," : ".";
  });
}

/** Numbers as bare digit strings, so "S$5,600", "$5,600" and "５，６００" all become "5600". */
export function numbers(text: string): string[] {
  return (toAsciiDigits(text).match(new RegExp(numberPattern, "g")) ?? []).map((n) =>
    n.replace(/,/g, ""),
  );
}

/**
 * Splits text into alternating plain and number parts, so the review page can wrap each number in a
 * <mark> without touching the rest of the quote. Odd indexes are the numbers, exactly as written.
 */
export function splitOnNumbers(text: string): string[] {
  return text.split(new RegExp(`(${numberPattern})`));
}
