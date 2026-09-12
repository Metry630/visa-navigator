# Stream E: the engine

**Owns.** `src/engine/`.

**How.** Joshua writes the TypeScript and Claude pairs: explain the options, review his code, suggest
tests, and don't take over unless he asks. This stream is his Pints prep (generics, discriminated unions,
narrowing, zod).

**Tasks.** Driven by the "Needs a new kind" lists in `docs/research/sg.md` and `docs/research/jp.md`.
- New requirement kinds in `schema.ts` (the discriminated union) and `evaluate.ts`, each with tests
  covering at least three nationalities. Likely candidates: graduated within N years (J-Find), university
  lists (J-Find, COMPASS qualifications), points tests (Japan's Highly Skilled Professional), and whether
  dual nationals count under each nationality list.
- Keep `types.ts` changes additive. If the UI needs a new field (for example nationality-specific notes on a
  route), add it and hand stream U the UI request.
- Keep `check-data`'s grounding rules working for every new kind: any number a user can see must be in a quote.
- Stream C has landed the optional `check: "manual"` source flag on `SourceSchema` in `schema.ts`
  (`z.enum(["auto", "manual"]).optional()`). It is additive, the engine ignores it, and the drift
  check skips those sources and reports how many it skipped. Nothing to do unless you change how
  sources are shaped.

**Land.** `scripts/land.sh`.
