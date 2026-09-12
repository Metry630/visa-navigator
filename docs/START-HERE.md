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
- `npm test` (31 tests), `npm run typecheck` and `npm run check:data` are green, and **CI on GitHub is
  green** as of commit `92b90d4`. Every earlier run had failed at the install step: `vitest` was added
  with npm, which does not update `bun.lock`, and CI installs with `bun install --frozen-lockfile`.
  Lovable ran `bun install` to fix it. Read the dependency note in `CLAUDE.md` before adding a package.
- Streams C and R-SG are done. Stream D (discovery) is running. **R-JP has not run yet**: there is no
  `src/data/jp`, no `stream/r-jp` commits and nothing in `docs/research/jp.md`. Its worktree is created
  and waiting at `../visa-navigator-r-jp`. E and U are open.

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

Batch them into as few messages as possible. Budget is ~150 credits for v0.

**Done 2026-09-12** (commit `61571d0`, 4.3 credits): the trust fix, so source lines now say
"Retrieved <date>" and only `verifiedOn` is ever called verified; the footer and the home trust line
reworded to match; dates rendered as "1 Jan 2027" through one helper; the methodology source-code link
pointed at the repo; and a 375px pass over `/check` and `/results`. The project knowledge now carries the
retrieved-versus-checked rule, so the agent won't reintroduce it.

Still queued:

1. The home trust line reads "a person verifies it before it is marked verified", which repeats itself.
   Ask for one short sentence instead. Fold this into the next batch rather than spending a message on it.
2. Make the name consistent in the header, page titles and meta tags once Joshua picks it.
3. Later, once stream E adds them: nationality-specific notes on route cards.
