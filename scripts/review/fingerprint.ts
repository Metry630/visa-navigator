// What a reviewer actually approved, reduced to one string.
//
// The review page used to record only that a requirement had been approved, never what it said, so
// editing a requirement afterwards left the approval attached to text nobody had read. That happened
// on 2026-09-12: jp-working-holiday was stamped, funds-for-initial-stay was then rewritten, and the
// route went on claiming a person had verified it. A stamp that can go stale silently is worse than
// no stamp, because the whole product rests on it.
//
// So an approval carries a fingerprint of the requirement, and an approval whose fingerprint no
// longer matches is not an approval.
import { createHash } from "node:crypto";
import type { Requirement } from "../../src/engine/schema";

/**
 * Stable JSON: keys sorted at every level, so a reordered file does not read as a changed rule.
 * Arrays keep their order, because the order of sources and of salary rows is meaningful.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

/**
 * Everything a reviewer reads when deciding. The whole requirement, which is deliberately blunt:
 * every field is either shown on the page or changes what the engine does with it, and a new field
 * added later should invalidate old approvals rather than be quietly excluded from the check.
 */
export function fingerprint(req: Requirement): string {
  return createHash("sha256").update(canonical(req)).digest("hex").slice(0, 16);
}

/** An approval only counts while it still matches what is on disk. */
export function isApproved(
  note: { decision?: string; hash?: string } | undefined,
  req: Requirement,
): boolean {
  return note?.decision === "approve" && note.hash === fingerprint(req);
}

/** An approval that was given, but for text that has since changed. */
export function isStale(
  note: { decision?: string; hash?: string } | undefined,
  req: Requirement,
): boolean {
  return note?.decision === "approve" && note.hash !== fingerprint(req);
}
