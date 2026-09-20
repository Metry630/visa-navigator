# Launch runbook

Publishing is **held on purpose**, not blocked by anything technical. Joshua decided on 2026-09-18 not
to put it in front of anyone while the data is part-verified. Everything else is finished, so this
list is what is left, and it is meant to be followed rather than remembered.

`deploy_project` costs no Lovable credits. Only `send_message` to the agent does.

## 1. Finish the review

```bash
cd ~/kerjaan/lovable/visa-navigator      # main, NOT one of the -c / -d / -r-jp / -r-sg worktrees
npm run review -- --by joshua            # http://127.0.0.1:4178
```

Keys: `J` and `K` move, `A` approves, `R` rejects, `C` comments.

The gate is `npm run check:data -- --release` reporting `verified 10/10` with **no error lines**. Until
then it errors once per unverified route. As of 2026-09-20 that is **one route**,
`jp/engineer-specialist`, and it is the entire gate.

Two things the page does for you. A requirement whose text or sources changed since you approved it
shows as **needs re-reading** and does not count, so an edit can never inherit an old approval. And on
startup the server clears any stamp its approvals no longer justify, naming what it cleared and why,
so a route cannot sit there claiming to be verified when it is not.

## 2. Run every check

```bash
npm test                 # 116 tests
npm run typecheck
npm run lint
npm run check:data -- --release
npm run check:contrast
npm run check:sources
npm run build
```

Read each exit status directly. **Do not pipe a checker into `tail` or put it on the left of `&&`** —
both discard the exit code and report green on red. That mistake pushed two red CI runs on 18 Sep.

`check:sources` exits non-zero only when a quote has **moved**. A page that did not answer is reported
separately and is not a failure, because that is usually the publisher rate-limiting the fetcher and it
has cleared on its own before. If it reports unreachable pages, diagnose with `npm run check:sources`
and not with `curl`: MOFA answers Node's `fetch` and refuses `curl`, so curl cannot tell you whether
the drift check can read a page.

`check:contrast` converts the oklch tokens in `src/styles.css` by hand and asserts every text pair the
UI renders, in both modes. It carries a ratchet as well as the 4.5:1 AA floor: the worst pair may not
fall below the recorded `WORST_FLOOR`, which was 5.58:1 on 2026-09-20. A palette change that lowers it
moves the constant in the same commit and says why.

### The four things nobody has ever checked

The terminal checks above have all been green for weeks. These have never been run once, because the
claude-in-chrome extension cannot set a phone viewport (Chrome stops at roughly 1000px wide) and
cannot force a colour scheme. `chrome-devtools-mcp` can do both, and it launches its own Chrome:

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest   # then restart Claude Code
npm run dev                                                          # it drives the local server
```

Against `/`, `/check`, `/results`, `/routes`, `/routes/:id`, `/pack` and `/changes`:

1. **375px**, via `emulate` with a mobile viewport. No horizontal scroll on the body, and the route
   table collapses to stacked rows rather than scrolling sideways.
2. **Both modes.** Since 2026-09-21 the paper palette is the default for everyone and dark is reached
   only through the header toggle, which writes `theme` to `localStorage`. So: load with no stored
   preference on a machine set to dark and confirm the page is still **paper** (the system must no
   longer decide), then toggle and confirm dark holds across a navigation and a reload with no flash
   of the wrong palette. `check:contrast` proves the palette, not the layout, and the dark layout has
   had far more eyes on it than the light one.
3. **`lighthouse_audit`** on `/`, `/routes` and one `/routes/:id`. Record the accessibility and SEO
   scores as the pre-publish baseline, because SEO on those two pages is the whole route-library
   thesis and section 6 is about to start measuring it.
4. **`take_snapshot`** on `/check` and `/results`: every control reachable, the disclosures reporting
   their open state, the live region intact. And on `/routes` at 375px, that the table still reports
   `table`, `row`, `columnheader` and `cell` roles once the stylesheet has turned it into blocks.

## 3. Tell Pints first

**This is a hard gate and the easiest one to forget.** Per `CLAUDE.local.md`, Calvin confirmed in
writing that personal open-source work on Joshua's own time and hardware is fine, and asked him to
"sound off if there is any conflict of interest". So Gabriel or Calvin hears about it before anything
public goes out under his name.

Do this before publishing, not between publishing and posting.

## 4. Publish

```
mcp__lovable__deploy_project   # project e24dc628-aae5-421c-99fa-969c29510ffb
```

## 5. Check the live site

The things most likely to be wrong are the ones that only exist once there is a real domain, because
every absolute URL is built from the incoming request's origin.

- `curl https://<domain>/robots.txt` — the `Sitemap:` line is an **absolute** URL on the real domain.
  A relative one is silently ignored by every crawler, which would make the whole SEO pass inert.
- `curl https://<domain>/sitemap.xml` — the five static pages (`/`, `/check`, `/routes`, `/changes`,
  `/methodology`), one URL per route, and one `/pack?route=<id>` per route that has an employer
  requirement, all on the real domain, and **no `/results`** and no `/pack` carrying a `p`, since both
  contain someone's answers. Count it rather than trusting a number written here, which has already
  gone stale twice:

  ```bash
  # grep -c counts LINES and the sitemap is one line, so it answers 1. Count occurrences:
  curl -s https://<domain>/sitemap.xml | grep -o '<loc>' | wc -l   # expect routes + packs + 5
  ls src/data/*/*.json | wc -l                                     # routes
  grep -l '"who": "employer"' src/data/*/*.json | wc -l            # packs
  curl -s https://<domain>/sitemap.xml | grep -c 'p='              # must be 0: no profile in a sitemap
  ```
- One route page, for example `/routes/jp-jfind`, serves its own `<title>`, description and OG tags,
  and an absolute `og:image`.
- A Japanese-sourced route shows the unofficial translation under each original quote.
- `/pack?p=...&route=...` prints to one page with the full quotes expanded and no nav or buttons, and
  serves `robots: noindex` because that URL carries a profile.
- `/pack?route=...` with **no** profile renders the same employer checklist, carries no `noindex`, and
  has a canonical URL of `/pack?route=<id>`. This is the form a hiring manager can be sent and search
  can find.
- An unverified route still says **Not yet verified** on its card.
- `/results` for someone with no offer leads with the routes they can apply for themselves, and a
  route needing no employer does **not** say "Employer applies for you".
- The console is clean, checked in a **clean browser profile**. Joshua's everyday Chrome has an
  extension that writes `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` onto `<body>`, and
  React reports that as a hydration mismatch. It is the extension, not the site, and it will waste an
  hour if it is met for the first time on launch day. chrome-devtools-mcp launches its own Chrome and
  does not have it.

## 6. Then watch one number

`get_project_analytics`, weekly.

The number that matters is arrivals on `/routes` and `/routes/:id` **from search**, broken out by page
rather than aggregate. That is the whole thesis of the route library: discovery found people being told
on Reddit that J-Find does not exist while others corrected them, and the point of those pages is to
be findable by someone searching that. If it stays at zero, the SEO work did not land, however good
the pages look.

Total visitors is the vanity number. Ignore it.

## What is deliberately not here

- **A launch post.** Not drafted. It goes out under Joshua's name, so he writes or approves it, after
  step 3.
- **The five Reddit reply candidates** in `research/discovery/reply-candidates.md`. Threads where a
  sourced answer would genuinely help, and every one is now answerable from the data. Nothing has been
  posted and nothing should be without him.
- **A custom domain.** Not decided. The lovable.app subdomain works, and nothing in the code hardcodes
  a host, so moving later costs nothing.
