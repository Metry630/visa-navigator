# Start here

Briefing for the next sessions. Read `CLAUDE.md` for the rules; this file is the order of work.

## Where things stand (2026-09-11)

- Repo is public at `Metry630/visa-navigator` and connected to Lovable. Lovable built the UI; the
  real engine replaced its stub.
- One route is in: **Singapore Employment Pass**, 9 requirements, every one quoted from MOM's page, all
  92 salary figures checked against MOM's table by script. **Not yet verified by a person.**
- `npm test` (13 tests), `npm run typecheck` and `npm run check:data` are green.

## Joshua's checkpoints (everything else runs on its own)

1. **Verify SG Employment Pass**: run `npm run review` and open http://127.0.0.1:4178. J and K move,
   A approves, R rejects, C comments. The route is stamped only once all 9 requirements are approved.
   About 20 minutes.
2. **Chrome for discovery.** When stream D asks, have Chrome open with the Claude extension, logged in to
   Reddit, X and LinkedIn, and approve those three sites once.
3. **Stream E is yours** (TypeScript practice): new rule kinds, written by you with Claude pairing.
4. **Pick the name:** "Visa Routes" (what the UI says) or "Visa Navigator" (repo and Lovable).
5. **Before cancelling LinkedIn Premium,** check Lovable Settings → Plans for the Pro Lite end date.
6. **Pints prep** this week: the TypeScript sections of the Udemy course (generics, unions and
   narrowing, utility types).

## Tabs to open

Two or three at a time; they share one Claude plan. For each stream except U:

```bash
cd ~/kerjaan/lovable/visa-navigator && scripts/new-stream.sh <id>
cd ../visa-navigator-<id> && claude
```

Then paste: **"Read CLAUDE.md, CLAUDE.local.md and docs/streams/<id>.md, then do that stream. Land
with scripts/land.sh when every check is green."**

| Order | Stream | What it does | Needs you? |
|---|---|---|---|
| 1 | `c` | Drift check, CI, weekly cron, the review page | Only to use the review page at the end |
| 1 | `r-sg` | The remaining Singapore routes as data files | No |
| 2 | `d` | Discovery from public posts; picks target nationalities | Chrome, when it asks |
| 2 | `r-jp` | The Japan routes as data files | No |
| 3 | `e` | New rule kinds the research needs | Yes, it's your TS practice |
| any | `u` | UI changes through Lovable (run from the main folder, no worktree) | No |

## What Lovable should do (stream U sends these, a few credits each)

Batch them into as few messages as possible. Budget is ~150 credits for v0; 303 were left on 2026-09-11.

1. **Trust fix first.** Each source line says "Checked <date>", but that date is `source.retrievedOn`,
   when the page was fetched, not when a person checked it. Label it "Retrieved <date>". Only a route's
   `verifiedOn` may be described as checked or verified (it already shows "Not yet verified" when null).
2. Point the methodology page's source-code link at https://github.com/Metry630/visa-navigator.
3. Make the name consistent in the header, page titles and meta tags once Joshua picks it.
4. Show dates as "1 Jan 2027" rather than "2027-01-01".
5. A mobile pass over `/check` and `/results`.
6. Later, once stream E adds them: nationality-specific notes on route cards.
