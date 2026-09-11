# Stream C: checks, CI and the review page

**Owns.** `scripts/`, `.github/`, and the review page.

**Already there.** `scripts/check-data.ts` (schema, grounding, verification report), `scripts/check-sources.ts`
(every quote is still on its live page), `scripts/page-text.ts` (the shared page-to-text normalisation) and
`scripts/fetch-source.ts`.

**Tasks.**
1. **CI** (`.github/workflows/ci.yml`) on pushes and pull requests to `main`: install, `npm test`,
   `npm run typecheck`, `npm run check:data`. `package-lock.json` isn't committed because Lovable uses
   `bun.lock`, so choose bun or npm deliberately and say why in a comment.
2. **Weekly drift check** (`.github/workflows/sources.yml`, cron): `npm run check:sources`; on failure,
   open an issue listing the missing quotes.
3. **Manual sources.** Some official sources are PDFs or JS-rendered pages. Add an optional
   `check: "manual"` to `SourceSchema` (an additive change; tell stream E), make `check-sources` skip them
   and report how many it skipped.
4. **Review page** (`scripts/review/`, local only, never deployed). For every requirement show its text,
   who checks it, effective dates, and each quote with the numbers highlighted, plus a button that opens
   the source. Keyboard: J / K to move, A approve, R reject, C comment. Only when every requirement in a
   route is approved does it write `verified: { by: "joshua", on: <today> }` into the route file.
   Rejections and comments go to `research/review-notes.md`. Base the interaction on
   `~/kerjaan/claude-spam/benchmark/relabel_2026.py` (focus, highlight, keyboard flow). It must never
   approve anything by itself. One command starts it; document that command in `CLAUDE.md`.
5. **README metric line** between markers, generated from the checks: routes covered, % sourced,
   % verified, quotes live, and the oldest verification.

**Checkpoint.** When the review page works, push-notify Joshua to verify the SG Employment Pass.

**Land.** `scripts/land.sh`.
