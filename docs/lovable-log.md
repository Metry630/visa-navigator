# Lovable log

Every message sent to the Lovable agent, what it cost and what it changed. Stream U keeps this.
Pro Lite gives no monthly credits, so the budget is what is left of the 300 one-time credits plus 5 a day.

| Date | Credits | Commit | What |
|---|---|---|---|
| 2026-09-12 | 1.3 | `6f1ea19` | Plan for the four-part UI batch. The agent paused for plan approval rather than editing. |
| 2026-09-12 | 3.0 | `61571d0` | The batch: "Retrieved" instead of "Checked" on source lines, footer and home trust line reworded, dates rendered as 1 Jan 2027 through one helper, methodology source link pointed at the repo, 375px pass over /check and /results. |
| 2026-09-12 | 0.7 | `92b90d4` | Ran `bun install` so `bun.lock` matched `package.json` and CI stopped failing at the install step, plus the repeated home trust sentence. |
| 2026-09-12 | 0.7 | `6939406` | Reordered the checklist groups so "Ask the employer" leads each route card, and gave that heading slightly more weight. From discovery: 21 of 99 coded posts were employer confusion, the single biggest category. |
| 2026-09-18 | 0 | - | Project knowledge rewritten: the settled name and strapline, `public/` added to what Lovable owns, the non-English quote rule, "never hardcode a route", and "do it all in one turn". Knowledge costs nothing; only `send_message` does. |
| 2026-09-18 | 4.7 | `d1c0d36` | Batch 1. Route library at `/routes` built on `listRoutes()`, translations rendered under quotes, per-page titles, descriptions, OG and canonical tags, "Visa Routes" and the strapline made consistent. Sitemap declined, see below. |

| 2026-09-18 | 4.4 | `e0b91a7` | Batch 2. `SourceLink` reverted to compact, `/sitemap.xml` served from a server route that builds absolute URLs from the request origin, results sorted open first with closed routes collapsed, per-destination counts, a copy-link button through `src/lib/share-link.ts`, degree capitalised. |
| 2026-09-18 | 0 | `83a8b42` | Workspace skill `ship-check`: what to verify before calling a UI change done. Costs nothing and keeps the verification bar out of every message. |

| 2026-09-18 | ~4.5 | `7ffa259` | Batch 3. The employer pack at `/pack?p=&route=`, employer-only checklist items with quotes and translations, a print stylesheet, "Send this to your employer" on the results cards that have employer items, `share-link.ts` extended with `buildPackLink`, and `robots.txt` moved to a server route so its Sitemap line is an absolute URL. |

**Spent so far: ~19.3.** 303 were left on 2026-09-11, so about 284 remain against a v0 budget of ~150.

A third thing worth knowing: **the first attempt at batch 3 never reached Lovable.** The MCP call
gave up after 300s of silence and the agent never started, so nothing was charged and nothing was
built. Resending with `wait: false` returned immediately and the agent ran fine. Use `wait: false`
for anything large and poll the repository for the commit.

Two things worth knowing from batch 1:

- **Say where a change applies, not just what it is.** "Show the translation everywhere a quote is
  rendered" was read as "render the quote everywhere too", so `SourceLink` started printing full
  government quotes on every checklist line of `/results`, which buries a page that is meant to be
  scanned. The agent did what was asked; the request was too broad. Batch 2 reverts it.
- **A refusal can be worth arguing with.** It skipped the sitemap because no public domain is known.
  That is true but not a blocker: this is TanStack Start, so a server route can build absolute URLs
  from the incoming request's own origin, which is right on the preview domain and stays right after
  publishing. Asked again in batch 2 with that spelled out.

Notes that save credits:

- Batch several changes into one message. The four-part batch cost 3.0 for what would have been four messages.
- The agent may answer a request with a plan and stop. That first turn still costs, so say "do all of this in
  one turn" in the request itself.
- Put durable rules in project knowledge instead of repeating them per message. The "Retrieved versus
  Checked" rule is in there now, so it should not have to be asked for again.
