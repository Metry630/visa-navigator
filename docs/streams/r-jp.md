# Stream R-JP: Japan routes

**Goal.** Every route a new graduate could use to work in Japan, as data files ready for Joshua to verify.

**Owns.** `src/data/jp/` and `docs/research/jp.md`. Follow the shape of `src/data/sg/employment-pass.json`.
Japanese salaries are **JPY per year**.

**Routes to investigate.** These are leads, not facts: confirm each one exists, applies to new graduates,
and what it needs.
- Engineer / Specialist in Humanities / International Services (status of residence)
- Highly Skilled Professional (points-based)
- J-Find, the Future Creation Individual Visa (graduates of listed universities, job hunting)
- Working Holiday (partner-country list and age limits)
- Designated Activities for job hunting: probably only for graduates of Japanese universities. Confirm, and
  if so record it in `docs/research/jp.md` without adding a file.

**Sources.** The Immigration Services Agency of Japan (moj.go.jp/isa) and the Ministry of Foreign Affairs
for working-holiday lists. Prefer English pages. If a rule only exists in Japanese, quote the Japanese
verbatim, write `text` in English, and flag it in `docs/research/jp.md` for the reviewer.

**Method.** Same as R-SG: `scripts/fetch-source.ts`, quotes copied from `.sources/`, then `check:data` and
`check:sources`. `fetch-source.ts` only reads HTML. For a PDF, record the URL and quote in
`docs/research/jp.md` and mark the requirement for manual checking (stream C is adding a manual flag).
Points tests will need a new kind from stream E; until then write them as `manual`.

**Start small.** Land one simple route end to end first (Working Holiday is a good candidate) to prove
Japanese data flows through to the UI, then do the rest.

**Done when.** Each JP route has a file that passes both checks, and `docs/research/jp.md` lists every
route considered (in or out, with the reason), anything quoted in Japanese, and the questions for Joshua.

**Land.** `scripts/land.sh`.
