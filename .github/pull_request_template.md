## What this changes

<!-- One or two sentences. If it changes a visa rule, say which rule and what it now says. -->

## Checks

- [ ] `npm test`, `npm run typecheck`, `npm run lint` and `npm run check:data` pass
- [ ] `npm run check:sources` is clean for any source this touches
- [ ] Any new or changed quote was copied out of `.sources/<name>.txt`, not from a model, a summary or
      a translation tool, and includes the whole clause rather than starting mid-sentence
- [ ] A non-English quote carries a literal `translation`
- [ ] This does **not** set `verified` on any route. Only the maintainer's review page writes that.

<!-- CONTRIBUTING.md explains why each of these matters. -->
