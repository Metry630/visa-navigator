# Start here

Briefing for the next sessions. Read `CLAUDE.md` for the rules; this file is the order of work.

## Where things stand (2026-09-12)

- Repo is public at `Metry630/visa-navigator` and connected to Lovable. Lovable built the UI; the
  real engine replaced its stub.
- **Six Singapore routes** are in (Employment Pass, S Pass, EntrePass, Training Employment Pass, Work
  Holiday Pass, Work and Holiday Pass): 42 requirements, every one quoted from an official page, every
  number checked against its quote by script. **None verified by a person yet.**
- Stream C landed: CI on every push, a weekly drift check that opens an issue when a quote moves, the
  review page (`npm run review`), and a README coverage block.
- `npm test` (31 tests), `npm run typecheck` and `npm run check:data` are green.
- Streams C and R-SG are done. Stream D (discovery) is running. R-JP, E and U are open.

## What each session inherits

- **offload / `bulk-read`**: yes. `scripts/new-stream.sh` copies `.claude/skills/offload` and
  `.claude/settings.local.json` into the worktree, because both are untracked and don't follow a worktree.
- **The Lovable MCP**: yes, since 2026-09-12. It was registered only for `~/kerjaan/lovable`, so the first
  worktree sessions couldn't see it. It is now at user scope
  (`claude mcp add --scope user --transport http lovable https://mcp.lovable.dev`), so every session gets
  it. Check with `/mcp` and authenticate once if asked. Only stream U needs it.
- A new worktree is a new folder, so the first `claude` there asks you to trust it.

## Joshua's checkpoints (everything else runs on its own)

1. **Verify the six Singapore routes**: run `npm run review` and open http://127.0.0.1:4178. J and K
   move, A approves, R rejects, C comments. A route is stamped only once every one of its requirements
   is approved. 42 requirements in total, so budget about an hour, or do the Employment Pass first and
   the rest later.
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
| done | `c` | Drift check, CI, weekly cron, the review page | Landed 2026-09-12 |
| done | `r-sg` | The Singapore routes as data files | Landed 2026-09-12 |
| running | `d` | Discovery from public posts; picks target nationalities | Chrome, when it asks |
| next | `r-jp` | The Japan routes as data files | No |
| next | `u` | UI changes through Lovable (run from the main folder, no worktree) | No |
| after R-JP | `e` | New rule kinds the research needs | Yes, it's your TS practice |

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
