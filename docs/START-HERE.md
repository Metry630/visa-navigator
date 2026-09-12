# Start here

Briefing for the next sessions. Read `CLAUDE.md` for the rules; this file is the order of work.

## Where things stand (2026-09-12, end of day)

**10 routes, 89 requirements, 89 of 89 sourced, 5 of 10 stamped by a person.**

| Destination | Routes | Stamped |
|---|---|---|
| Singapore | Employment Pass, S Pass, EntrePass, Training Employment Pass, Work Holiday Pass, Work and Holiday Pass | 4 of 6 |
| Japan | Working Holiday, Engineer/Specialist, J-Find, Highly Skilled Professional | 1 of 4 |

`npm test` (68 tests), `npm run typecheck` and `npm run check:data` are green. CI on GitHub is green.
Drift check: 102 quotes confirmed live, 0 moved, 18 checked by hand, 21 unreachable (all MOFA, see below).

Streams C, R-SG, R-JP and D are all **done**. E and U are open.

### The publish gate

`npm run check:data -- --release` errors on the five unstamped routes: `sg/employment-pass`,
`sg/s-pass`, `jp/engineer-specialist`, `jp/jfind`, `jp/highly-skilled-professional`. Nothing publishes
until all five carry a person's stamp. That is 50 requirements and it is the only thing between the
project and a public URL.

### The first review landed (2026-09-12)

Joshua reviewed all seven routes that existed at the time and stamped five. Three of his four comments
were real findings and are fixed in `9f633b1`; the fourth agreed with the data. Full write-up in
`docs/research/sg.md` and `docs/research/jp.md` under "Resolved from the 2026-09-12 review". The one
that matters: the EP 2027 salary floor stated only half its own rule, since the quote covers new
applications from 1 Jan 2027 **and** renewals of passes expiring from 1 Jan 2028, and the text named
only the first. `check:data` could not have caught it, because it checks that numbers the user sees
appear in a quote, not that everything in a quote reaches the user.

### MOFA is blocking the fetcher

Started 2026-09-12, site-wide, including `mofa.go.jp/index.html`. Browser user agent, Referer,
HTTP/1.1 and a cookie jar all still get 403, while MOM returns 200 in the same run, so it is an IP
block rather than drift. 21 quotes are affected, all on the Working Holiday route. The data is fine and
the snapshots are in `.sources/`. Deliberately **not** marked `check: "manual"`, because that flag is
for pages the fetcher can never read, not pages that blocked us. The weekly job will keep failing until
this is decided. Written up as question 4 in `docs/research/jp.md`.

## Joshua's checkpoints

1. ⭐ **Stamp the remaining five routes.** `npm run review`, then http://127.0.0.1:4178. J and K move,
   A approves, R rejects, C comments. A route is stamped only when every requirement in it is approved.
   50 requirements. Do Employment Pass and S Pass first: they are the two highest-traffic routes in the
   discovery data and they unblock Singapore on its own.
2. **Two Japan research questions**, both in `docs/research/jp.md`: whether the Highly Skilled
   Professional points table gets transcribed by hand once (no machine-readable official source exists
   for it), and what to do about the MOFA 403.
3. **Decide the MOFA 403:** wait it out, slow the fetcher, or report a 403 differently from a moved
   quote.
4. **Stream E is yours** (TypeScript practice): new rule kinds, list in `docs/research/sg.md` and
   `docs/research/jp.md` under "Needs a new kind". Four are queued; item 4 (new application versus
   renewal) came out of your own review.
5. **Before cancelling LinkedIn Premium,** check Lovable Settings → Plans for the Pro Lite end date.
6. **Pints prep** this week: the TypeScript sections of the Udemy course.

Settled 2026-09-12, no longer open: the name is **Visa Routes**.

## What Lovable does next (stream U, from the main folder)

Decided 2026-09-12. The problem being fixed is that Lovable had been used as a copy-editing service,
5.7 credits of about 297 across four messages, while stream D's discovery produced a ranked list of five
real user confusions and the UI answered roughly one of them. Credits are not the constraint. Three
feature-sized batches, one message each, each answering something the discovery measured.

**Batch 1: name, strapline, route library, SEO.** `set_project_knowledge` first, which costs nothing.
Then one message: a `/routes` index built on the `listRoutes()` the engine already exports and the UI
has never called, per-route meta and OG tags on `routes.$routeId.tsx`, and a `sitemap.xml` generated
from `listRoutes()`. Discovery confusion #3 was people being told on Reddit that J-Find does not exist
while others corrected them; nobody searching for that can currently reach this site.

**Batch 2: results rework and sharing.** `results.tsx` renders a flat wall of equal cards with closed
routes taking the same space as open ones, and no share affordance even though the profile is already
in the URL. Order open first, collapse closed, add a share button, add a Singapore versus Japan
summary. Every share URL goes through one module (`src/lib/share-link.ts`) so a backend could later
issue short ids without any caller changing.

**Batch 3: employer pack.** The largest measured confusion, 21 of 99 posts, biggest in both countries.
A `/pack` route rendering only the `who: "employer"` checklist items for one route, each with its quote
and "Retrieved <date>", written for someone who has never sponsored anyone, with a print stylesheet
because it will be forwarded by email.

Deferred: the rule-change feed. Not built: any backend. The frontend-only rule holds.

Log every message in `docs/lovable-log.md`. Batch, and say "do all of this in one turn" in the request,
because the agent has once replied with a plan and stopped, and that turn still cost.

## Tabs to open

Two or three at a time; they share one Claude plan. For each stream except U:

```bash
cd ~/kerjaan/lovable/visa-navigator && scripts/new-stream.sh <id>
cd ../visa-navigator-<id> && claude
```

Then paste: **"Read CLAUDE.md, CLAUDE.local.md and docs/streams/<id>.md, then do that stream. Land
with scripts/land.sh when every check is green."**

| Stream | What it does | State |
|---|---|---|
| `c` | Drift check, CI, weekly cron, the review page | Landed |
| `r-sg` | The Singapore routes as data files | Landed |
| `d` | Discovery from public posts | Landed: 99 coded posts, five ranked confusions |
| `r-jp` | The Japan routes as data files | Landed: all four routes |
| `u` | UI through Lovable, from the main folder, no worktree | Next: the three batches above |
| `e` | New rule kinds | Yours, whenever you want the TypeScript practice |

## What each session inherits

- **offload / `bulk-read`**: yes. `scripts/new-stream.sh` copies `.claude/skills/offload` and
  `.claude/settings.local.json` into the worktree, because both are untracked and don't follow a worktree.
- **The Lovable MCP**: yes, at user scope, so every session has it. Only stream U needs it.
- **`.sources/` does not follow a worktree** and is gitignored. The Singapore snapshots are in
  `visa-navigator-r-sg/.sources/`, the Japan ones in `visa-navigator-r-jp/.sources/`. Read quotes from
  there rather than refetching, especially while MOFA is blocking.
- A new worktree is a new folder, so the first `claude` there asks you to trust it.
