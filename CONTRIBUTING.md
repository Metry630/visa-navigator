# Contributing

Thanks for looking. The most useful thing you can send is **a rule that is wrong**, with the official
page that proves it.

This project has one unusual property and everything below follows from it: **no visa rule here is
allowed to exist without a verbatim quote from an official page behind it.** A pull request that is
correct but unsourced cannot be merged, because a reader has no way to check it, and being checkable
is the entire point.

## The quickest useful contribution

Open an issue using the **A rule is wrong** template. It asks for the route, the requirement, the
official URL and what the page says now. That is enough to act on and takes a few minutes.

You do not need to run anything to do this.

## Running it

```bash
npm install
npm run dev          # the app
npm test             # engine tests
npm run typecheck
npm run lint
npm run check:data   # schema, grounding and verification report for src/data
npm run check:sources    # re-fetches every page and checks each quote is still on it
```

**Adding a dependency needs bun, not npm.** `bun.lock` is the only committed lockfile and npm never
updates it, so `npm install <pkg>` leaves the lockfile stale and CI dies at its first step on
`bun install --frozen-lockfile`.

## Rules for visa data

These are enforced by `npm run check:data` and `npm run check:sources`, so a pull request that breaks
one will fail CI rather than get a reviewer's opinion.

1. **Official sources only.** A government page or an official scheme page. Law-firm guides, forums,
   news articles and blogs are useful leads for finding a rule, and are never citations for one.

2. **Quotes are verbatim from the page as rendered**, taken from a saved snapshot:

   ```bash
   npx tsx scripts/fetch-source.ts <name> <url>   # writes .sources/<name>.txt
   ```

   Copy the quote out of that file. **Never out of a model, a summary, a translation tool or a
   web-fetch tool.** Those paraphrase, and what they paraphrase away is exactly the thing that
   matters: a salary figure, an "or", a "such as", a parenthetical condition.

3. **Quote the whole clause.** A quote that starts mid-sentence can leave its own limits behind. One
   requirement here quoted a page from the middle of a sentence and dropped the part naming which
   statuses it applied to, which made the rule read far broader than it is. If a quote says "these
   requirements" or "the above", the thing it points at has to be inside the quote too.

4. **Every number a user sees must appear in one of that requirement's quotes.** `check:data` checks
   the requirement text, the route summary and every row of a salary table. Full-width digits count as
   the same number as ASCII ones, so a Japanese page's ７０ grounds an English "70".

5. **A non-English quote carries a literal `translation`.** `check:data` errors on any quote
   containing CJK characters without one. Write it literally rather than readably: keep the
   parentheticals, the "however" clauses and the "limited to cases where" conditions. The translation
   is a reading aid shown under the original, never a replacement for it, and it is never the source
   of a fact.

6. **A scheduled change is a new dated requirement**, with `effective.from`, not an edit to the old
   one. That is what makes `/changes` possible and it is how someone finds out a rule changes before
   it does.

7. **Never set `verified` in a pull request.** That field means a person read the rule against its
   source and approved it. It is written only by the local review page (`npm run review`), and an
   approval records a fingerprint of the requirement, so editing a requirement invalidates it
   automatically. A pull request that sets `verified` will be asked to remove it. Unverified data is
   fine and the site labels it; falsely verified data is the worst bug this project can have.

8. **Nationality lists** must use ISO 3166-1 alpha-2 codes that exist in `src/data/countries.json`,
   with no duplicates. `check:data` also reports how many countries in a list are actually named in a
   quote, because a list of codes that nothing backs is a rule nobody can check.

## Adding a route

One JSON file at `src/data/<cc>/<route>.json`, matching `RouteSchema` in `src/engine/schema.ts`. The
engine picks up any file in that tree with no code change. Read an existing route first;
`src/data/sg/employment-pass.json` is the fullest example, and `src/data/jp/jfind.json` shows a route
sourced from non-English pages.

Prefer `"kind": "manual"` over forcing a rule into a kind that does not fit. A manual requirement
shows on the checklist with who has to check it, and the engine reports it as unknown rather than
guessing. Wrongly telling someone a route is open is much worse than telling them it depends.

If a rule needs a kind the schema does not have, say so in the issue rather than approximating it. The
open ones are listed under "Needs a new kind" in `docs/research/sg.md` and `docs/research/jp.md`.

## Rules for the UI

The UI renders what the engine returns and holds no visa knowledge of its own. Import only from
`@/engine`. Never type a rule, number, date, route name or route count into a component, even a
correct one, because it will drift from the data and nothing will catch it.

`source.retrievedOn` and `route.verifiedOn` are different dates and must never be described with the
same word. Retrieved is when a script fetched the page. Verified is when a person read the rule
against it. Calling something checked when nobody checked it is the failure this project exists to
avoid.

## Licence

Code is Apache-2.0 (`LICENSE`). The data in `src/data/` is CC BY 4.0 (`LICENSE-DATA`). By contributing
you agree your contribution is licensed the same way. The government pages quoted remain their
publishers' material.
