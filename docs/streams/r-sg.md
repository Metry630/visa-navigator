# Stream R-SG: Singapore routes

**Goal.** Every route a new graduate could use to work in Singapore, as data files ready for Joshua to verify.

**Owns.** `src/data/sg/` and `docs/research/sg.md`. `src/data/sg/employment-pass.json` is the reference;
copy its shape.

**Routes to investigate.** These are leads, not facts: confirm each one exists, applies to new graduates,
and what it needs.
- S Pass (the pass below the Employment Pass salary floor)
- Work Holiday Pass (limited by nationality, age and university; get the official eligible lists)
- ONE Pass and Tech.Pass: probably not for new graduates. If so, record why in `docs/research/sg.md` and
  add no file.
- Anything else that applies to graduates of particular universities or nationalities.

**Method.**
1. `npx tsx scripts/fetch-source.ts <name> <url>` for each official page (mom.gov.sg and other official sources).
2. Read `.sources/<name>.txt` and copy quotes verbatim. Never quote WebFetch or bulk-read output.
3. Write the route file. `npm run check:data` and `npm run check:sources` must both pass.
4. If a rule needs something the schema can't express, write it as `"kind": "manual"` with the right
   `who`, and list it under "Needs a new kind" in `docs/research/sg.md` for stream E.
5. Routes with evaluable requirements (salary, age, degree, nationality lists) get tests in
   `src/engine/engine.test.ts` covering at least three nationalities.

**Done when.** Each SG route has a file that passes both checks, and `docs/research/sg.md` lists every
route considered (in or out, with the reason) plus the questions Joshua should answer while verifying.

**Land.** `scripts/land.sh`.

**Don't.** Set `verified`, invent numbers, or cite anything but official pages.
