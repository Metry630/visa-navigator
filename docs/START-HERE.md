# Start here

Briefing for the next sessions. Read `CLAUDE.md` for the rules; this file is the order of work.

## Run it from the right folder

There are five copies of this project on disk, one per stream, and both `.review/state.json` and
`.sources/` are gitignored, so neither follows between them. `visa-navigator-r-jp` is the trap: it
carries all ten routes and so looks like the finished project, but it sits on an old branch with no
translations and none of the review progress. Always work in `~/kerjaan/lovable/visa-navigator`, on
`main`.

All four stream branches have landed and every source snapshot has been copied into main, so the four
worktrees hold nothing that main does not. They are safe to remove with `git worktree remove`, which
leaves the branches alone.

## Where things stand (2026-09-18)

**10 routes, 93 requirements, 93 of 93 sourced, 4 of 10 verified by a person.** 92 tests, and
typecheck, lint, `check:data` and `build` all green, all four now gates in CI. Drift check:
**135 of 135 quotes live**, 0 moved, 18 checked by hand.

The verified count went down on purpose. Four processing-time requirements were added, and an audit of
the Singapore routes found three requirements whose text did not match its own sources. Six routes now
need one requirement re-read each, which the review page marks as "needs re-reading" and names. The
remaining work is **27 requirements**: three Singapore routes at one each, plus Engineer/Specialist 3,
J-Find 10 and Highly Skilled Professional 11.

| Destination | Routes | Stamped |
|---|---|---|
| Singapore | Employment Pass, S Pass, EntrePass, Training Employment Pass, Work Holiday, Work and Holiday | **6 of 6, done** |
| Japan | Working Holiday, Engineer/Specialist, J-Find, Highly Skilled Professional | 0 of 4 |

Streams C, R-SG, R-JP and D are done. U is running. E is open and is Joshua's.

### Publishing is held on purpose

Joshua decided on 2026-09-18 not to publish while the data is part-verified. Nothing technical is in
the way: tests, typecheck, lint, `check:data`, `check:sources` and `build` are all green, and
`deploy_project` costs no credits. **`docs/LAUNCH.md` is the runbook** and every command in it has been
run, with only the `--release` gate failing as expected.

### The publish gate

`npm run check:data -- --release` errors on the four Japan routes. Nothing publishes until all four
carry a stamp. Working Holiday needs **one** requirement (`funds-for-initial-stay`, rewritten after it
was first stamped); Engineer/Specialist needs 4 of 11; J-Find and Highly Skilled Professional are
untouched at 9 and 11.

### Approvals now carry a fingerprint

An approval records a hash of the requirement it was given for, and an approval whose hash no longer
matches the file is not an approval: the review page shows it as "needs re-reading" and the route
loses its stamp. This exists because on 12 Sep a stamped route had a requirement rewritten underneath
it and the stamp survived. See `scripts/review/fingerprint.ts`.

### The Japanese quotes are translated

43 quotes across the three newer Japan routes, each with a literal English rendering in
`source.translation`. `check:data` errors on a CJK quote without one. They render in the review page
and, since batch 1, on the public route pages too. Translating them caught five requirements whose
English was broader than its source; see `docs/research/jp.md`.

### MOFA is fine, and curl lies about it

The 12 Sep "MOFA is blocking us" finding is over, and was also reached with the wrong instrument.
`curl` still gets 403 from mofa.go.jp while Node's `fetch` gets 200 from the same machine. The drift
check runs on Node, so `npm run check:sources` is the only probe that answers the question.

## Joshua's checkpoints

1. ⭐ **Stamp the four Japan routes.** `npm run review -- --by joshua`, then http://127.0.0.1:4178.
   Working Holiday is one requirement. Every Japanese quote now has an English rendering under it.
2. **Two Japan research questions** in `docs/research/jp.md`: whether the Highly Skilled Professional
   points table gets transcribed by hand (recommendation: no, not until stream E has a points-test
   rule kind, since a transcribed table is data nothing can evaluate), and whether the route detail
   page should say out loud that a route was verified through a translation.
3. **Stream E is yours**, whenever you want the TypeScript practice. Four rule kinds are queued in
   `docs/research/sg.md` and `docs/research/jp.md`; item 4, new application versus renewal, came out
   of your own review.
4. **Before cancelling LinkedIn Premium,** check Lovable Settings → Plans for the Pro Lite end date.

Settled: the name is **Visa Routes**.

## Lovable (stream U)

10.4 credits spent of about 303. Credits have never been the constraint. Batches, one message each,
logged in `docs/lovable-log.md`.

- **Batch 1, landed `d1c0d36`, 4.7 credits.** Route library at `/routes` on `listRoutes()`,
  translations under quotes, per-page titles and OG tags, the name and strapline made consistent.
- **Batch 2, in flight.** Revert `SourceLink` to compact (batch 1 put full quotes on every `/results`
  checklist line, which buries the page), a `/sitemap.xml` server route building absolute URLs from
  the request origin, and the results rework: open routes first, closed ones collapsed, a copy-link
  button through `src/lib/share-link.ts`, per-destination counts.
- **Batch 3, queued: the employer pack.** The largest measured confusion, 21 of 99 coded posts,
  biggest in both countries. A `/pack` route rendering only the `who: "employer"` checklist items for
  one route, each with its quote and retrieved date, written for someone who has never sponsored
  anyone, with a print stylesheet because it gets forwarded by email.

Deferred: the rule-change feed. Not built: any backend. The frontend-only rule holds.

Two things learned the hard way, both in `docs/lovable-log.md`: say *where* a change applies and not
just what it is, and a refusal is sometimes worth arguing with.

## What each session inherits

- **offload / `bulk-read` and `code-write`**: yes. Use `code-write` for a file that follows an
  existing pattern closely, then **typecheck and read it**: vitest does not typecheck, and the last
  two generated test files passed their tests while failing `tsc`.
- **The Lovable MCP**: at user scope, so every session has it. Only stream U needs it.
- **`.sources/` is gitignored and does not follow a worktree**, so all 32 snapshots have been
  consolidated into the main worktree. Read quotes from there rather than refetching.
