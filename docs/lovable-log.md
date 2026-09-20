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

| 2026-09-18 | ~4.5 | `363360e` | Batch 4. A `/changes` page built from the `effective` dates, split into rules already in force and rules coming, each with its quote and translation. Home-page links to `/routes` and `/changes`. Methodology rewritten on two points: what the translations are, and what the weekly check actually does. `/changes` added to the sitemap. |

| 2026-09-18 | ~4.5 | `ece4982` | Batch 5. Focus and a polite live region on `/check` step changes, focus moved to the offending field when validation blocks, and one shared `evidence-quote.tsx` that collapses a quote over 220 characters behind a disclosure, with a print-only full copy so a forwarded `/pack` PDF still carries the whole quote. |

| 2026-09-18 | 4.9 | `72cdc8f` | Batch 6. The all-closed notice on `/results`, a real 1200x630 `public/og.png` screenshotted from a new internal `/og` page with Playwright, an origin-derived `og:image`, and Bahasa Indonesia, Hindi and Tagalog added to the language list. |

| 2026-09-18 | ~1.5 | `183bc88` | Removed `twitter:card` from all eight child routes so the root's `summary_large_image` applies, and dropped a duplicated `og:type` where a child repeated the root's value. |

| 2026-09-20 | ~4.5 | `d757424`..`75cd438` | Batch 7. Insights rendered above each destination's routes with their sources behind a disclosure, routes grouped by `requiresEmployer`, a job-offer question and a university-country select on `/check`, and the home page repointed at `/routes` as the primary action. See the correction below: it invented its own profile encoding. |

| 2026-09-20 | ~4.5 | `d759d1c`..`0ad95a1` | Batch 8. The usability pass, part one. `src/lib/profile-context.ts` deleted and both new answers routed back through `ProfileSchema`, `StatusBadge` given a third label so a route needing no employer stops claiming it does, the per-destination counts computed from `requiresEmployer` instead of status, the 157 source lines collapsed to one disclosure per requirement, and `OutcomeTag` silenced for `unknown`. |

| 2026-09-20 | ~4.5 | `bfaedd3`..`41e6e24` | Batch 9. `/check` cut from six steps and ten fields to one screen and four, with the rest behind an "Add more about yourself" disclosure; expected salary moved onto `/results` as an inline prompt driven by `ChecklistItem.missing`; `/routes` grouped by `requiresEmployer`; the three "Step 1/2/3" cards on the home page replaced by engine-computed counts and one real sourced requirement. |

| 2026-09-20 | 3.3 | `1ef3241`..`6e0d440` | Batch 10. `/pack` takes an optional profile, so the employer page is linkable from `/routes/:id` and indexable, with `noindex` kept only on the form carrying a profile; "Send this to your employer" promoted to a button in the route card header; `resetScroll: false` after the inline salary update. |

| 2026-09-20 | ~1 | - | Batch 11. The five profile-free `/pack` URLs added to the sitemap, filtered on a route actually having a `who: "employer"` requirement rather than on `requiresEmployer`. |

**Spent so far: ~52.5.** 303 were left on 2026-09-11, so about 250 remain against a v0 budget of ~150.

Batches 8 to 11 were a usability pass, and what made them cheap was that the measurement came first.
Each message carried the number that justified it: 157 repeated source lines, 78 of 94 requirements
rendering as "Unknown", 5 of 10 routes needing no employer while the badge said otherwise, 4 of 10
form fields driving all 16 evaluable requirements and the 8 language dropdowns driving none. The
agent did not argue with any of them and did not need a second turn to correct one.

Batch 7 is the sharpest example yet of the rule at the top of this file, and it cost a whole extra
batch to undo. It was asked to add a job-offer question and told: if the engine has no field for it,
add it to the form and the encoded profile **only if you can do that without touching `src/engine/`,
and otherwise leave a TODO and say so**. The engine did have the field. `Profile.hasOffer` and
`Profile.universityCountry` had landed in `0df4ab1` for exactly this, and the message said to pull
first. The agent neither used them nor left a TODO. It wrote `src/lib/profile-context.ts`, a second
copy of the base64url decoder that encodes a key called `hasJobOffer`, which `ProfileSchema` does not
know and silently strips, and then reads it back out of a raw `JSON.parse` that skips the schema
entirely. So the same URL was being treated as untrusted input in one function and trusted input in
the next, which is the one thing `decodeProfile` exists to prevent.

Two things to carry forward. **An escape hatch offered in a request will be taken, and not always the
way it was worded** — "only if you can without touching X, otherwise a TODO" was read as permission
to build a workaround. Name the field the agent should use instead of describing the condition under
which it may invent one. And **the engine changing under Lovable is worth saying loudly**: "pull the
latest, the engine gained two fields you will need" at the top of the next message is what made the
fix land in one turn.

Batch 6 is the one to learn from, in both directions.

- **It reported done on something it had not verified.** It toggled `allClosed = true`, grepped for the
  notice, got nothing, decided React's SSR comment nodes were splitting the text, reverted and said
  "Done". The notice may well render; nothing proved it. Read the transcript for what was actually
  checked rather than trusting the closing summary.
- **The request was built on a premise nobody had checked, and it was mine.** The all-closed state is
  currently unreachable: for the worst profile the schema allows, every destination still keeps two
  routes on "depends", because their blocking requirements are all `manual`, which evaluates to
  `unknown`, and the engine closes on `unmet`. The notice is defensive, not live. It becomes live if
  stream E makes those requirements evaluable, which is exactly stream E's job, so the code stays and
  an engine test now pins the invariant.
- **It introduced a defect the previous batch had no way to cause.** The root now sets
  `twitter:card: summary_large_image` while all eight child routes still set `summary`, and the deeper
  route wins, so every served page carried `summary` and cropped the new share card to a thumbnail.
  Caught by curling the rendered HTML rather than reading the diff.

Batch 5 came from reading the code rather than the product: `check.tsx` had no `aria-live`, no
`useEffect`, no `focus()` and no `ref`, so on every one of five step changes focus stayed on the button
while the form swapped underneath. Worth remembering that the offload `bulk-read` skill found that,
and that its line references needed confirming with grep before acting, exactly as the skill says.

`roadmap.md` has now been written into the repository root twice despite being asked not to, so the
rule is in project knowledge rather than repeated per message.

Batch 4 needed no correction, which is what the project knowledge and the `ship-check` skill are for:
the agent used `listRoutes()` and `getRoute()` rather than hardcoding, computed "past" and "future"
against render-time date, showed translations under originals, and described the weekly check exactly
as the code behaves, including that an unreachable page is not treated as a changed rule.

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
