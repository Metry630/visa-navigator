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

## Where things stand (2026-09-20)

**10 routes, 94 requirements, 94 of 94 sourced, 9 of 10 verified by a person.** 112 tests, and
typecheck, lint, `check:data` and `build` all green, all four gates in CI. Drift check:
**135 of 135 quotes live**, 0 moved, 18 checked by hand.

| Destination | Routes | Stamped |
|---|---|---|
| Singapore | Employment Pass, S Pass, EntrePass, Training Employment Pass, Work Holiday, Work and Holiday | **6 of 6, done** |
| Japan | Working Holiday, J-Find, Highly Skilled Professional | **3 of 3 stamped** |
| Japan | Engineer / Specialist in Humanities | **the last one** |

Streams C, R-SG, R-JP and D are done. U is running. E is open and is Joshua's.

### Publishing is held on purpose

Joshua decided on 2026-09-18 not to publish while the data is part-verified. Nothing technical is in
the way: tests, typecheck, lint, `check:data`, `check:sources` and `build` are all green, and
`deploy_project` costs no credits. **`docs/LAUNCH.md` is the runbook** and every command in it has been
run, with only the `--release` gate failing as expected.

### The publish gate

`npm run check:data -- --release` now errors on **one route**. Nothing publishes until
`jp/engineer-specialist` carries a stamp. That is the whole gate.

### The usability pass (2026-09-20)

The site was walked end to end against `research/discovery/summary.md` before publishing, and the
finding was that it led with a question it cannot answer. For a typical visitor (India, 23,
bachelor's) Singapore read "0 open, 5 depend on an employer, 1 closed", over 94 requirement lines of
which 78 said "Unknown", under 157 repeated "Source · publisher · Retrieved" lines. Three things were
wrong rather than merely unpolished, and all three are fixed:

- `status: "depends"` covers both "an employer must apply" and "we cannot check enough of this", and
  the badge said "Depends on employer" for both. EntrePass needs no employer and said it did. There
  are now three labels, and the per-destination count is computed from `requiresEmployer`.
- **Five of the ten routes need no employer** and the site never said so, which is the third largest
  confusion in the discovery set, 13 of 99 posts. `/results` and `/routes` now group by it, and
  `/results` puts the group you can act on first, branching on `Profile.hasOffer`.
- The employer pack answers the largest confusion, 21 of 99, and was a grey link at the bottom of a
  card.

Two engine fields were added for it, both additive (`94060b0`): `RouteSummary.requiresEmployer`, and
`ChecklistItem.missing`, which names the profile field that would settle an item. Only one case sets
it, a salary floor with no expected salary, and it is what lets `/results` ask for a salary beside the
line it changes rather than sending anyone back to the form.

`/check` went from six steps and ten fields to one screen and four, because four fields drive all 16
evaluable requirements: nationality 2, age 4, degree 2, expected salary 8. The other 78 requirements
are `kind: "manual"` and no answer settles them. The eight language dropdowns and years of experience
drove **zero**, since no route file uses a `language` or `experience` rule. Everything still collected
sits behind one "Add more about yourself" disclosure.

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

1. ⭐ **Stamp `jp-engineer-specialist`.** It is the only route left and the whole publish gate.
   `npm run review -- --by joshua`, then http://127.0.0.1:4178. Every Japanese quote has an English
   rendering under it.
2. **Two Japan research questions** in `docs/research/jp.md`: whether the Highly Skilled Professional
   points table gets transcribed by hand (recommendation: no, not until stream E has a points-test
   rule kind, since a transcribed table is data nothing can evaluate), and whether the route detail
   page should say out loud that a route was verified through a translation.
3. **Stream E is yours**, whenever you want the TypeScript practice. Four rule kinds are queued in
   `docs/research/sg.md` and `docs/research/jp.md`; item 4, new application versus renewal, came out
   of your own review.
4. **Before cancelling LinkedIn Premium,** check Lovable Settings → Plans for the Pro Lite end date.

Settled: the name is **Visa Routes**.

## Everything that is not data is finished

As of 2026-09-18 the non-data work is done and the runbook is `docs/LAUNCH.md`.

- **CI gates** tests, types, data, lint and build. Lint became possible after one whitespace-only pass
  over 26 code files; `.prettierignore` now excludes markdown and vendored directories so prose is
  never reflowed.
- **The project is actually open source**: `LICENSE` (Apache-2.0), `LICENSE-DATA` (CC BY 4.0 for
  `src/data/`), `CONTRIBUTING.md`, an issue form for "a rule is wrong", and a README written for a
  person rather than the build brief it used to be.
- **The UI is feature-complete for v0**: `/check`, `/results`, `/routes`, `/routes/:id`, `/changes`,
  `/pack`, `/methodology`, a sitemap and robots served from the request origin, a real 1200x630 share
  card, and focus plus live-region handling on the form. Feature-complete was true on 18 Sep and was
  not the same as usable; see the usability pass above for what a walkthrough found.

## Lovable (stream U)

About 43.7 credits spent of about 303, so roughly 259 remain against a v0 budget of ~150. Credits have
never been the constraint. Batches, one message each, logged in `docs/lovable-log.md`, which is the
authority; the notes below are only what a next session needs.

**Batches 7 and 8 (20 Sep) are the pair to read before writing another message.** Batch 7 was told to
add a job-offer question and given an escape hatch: do it without touching `src/engine/`, or leave a
TODO. The engine already had `Profile.hasOffer`. It took neither branch and invented
`src/lib/profile-context.ts`, a second base64url decoder writing a key the schema strips and reading
it back past the schema entirely. Batch 8 deleted it. **Name the field the agent should use rather
than the condition under which it may invent one**, and say "pull the latest, the engine gained two
fields you will need" at the top of the message whenever that is true.

Eight batches have landed. All of them are in `docs/lovable-log.md` with what each one changed and
what it cost.

Deferred: the rule-change feed. Not built: any backend. The frontend-only rule holds.

Three things learned the hard way, all in `docs/lovable-log.md`: say *where* a change applies and not
just what it is; a refusal is sometimes worth arguing with; and an escape hatch in a request will be
taken, so name the field rather than the condition.

## What each session inherits

- **offload / `bulk-read` and `code-write`**: yes. Use `code-write` for a file that follows an
  existing pattern closely, then **typecheck and read it**: vitest does not typecheck, and the last
  two generated test files passed their tests while failing `tsc`.
- **The Lovable MCP**: at user scope, so every session has it. Only stream U needs it.
- **`.sources/` is gitignored and does not follow a worktree**, so all 32 snapshots have been
  consolidated into the main worktree. Read quotes from there rather than refetching.
