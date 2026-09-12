# Japan research log

What was considered for Japan, what went in, what stayed out and why. Written by stream R-JP.
Nothing here is a citation. The citations live in the route files, quoted from `.sources/`.

Pages saved so far (all fetched 2026-09-12):

| Name in `.sources/` | Page |
|---|---|
| `jp-working-holiday.txt` | MOFA, The Working Holiday Programmes in Japan |
| `jp-jfind-mofa.txt` | MOFA, Designated activities (Future creation individual) |
| `jp-hsp-mofa.txt` | MOFA, Highly skilled professional visa |
| `jp-gijinkoku.txt` | ISA, Residence status "Engineer/Specialist in Humanities/International Services" |
| `jp-gijinkoku-kijun.txt` | ISA, 該当する活動・上陸許可基準について (PDF linked from that page) |
| `jp-gijinkoku-meikakuka.txt` | ISA, 「技術・人文知識・国際業務」の在留資格の明確化等について (index of PDFs, nothing quotable) |
| `jp-jfind-isa.txt` | ISA, 優秀な海外大学等を卒業した者が起業活動・就職活動を行う場合（J-Find） |
| `jp-jfind-universities.txt` | ISA, A list of Universities eligible for J-Find (PDF, as of January 2026) |
| `jp-jfind-outline-en.txt` | ISA, Outline J-Find (PDF, English) |

## In

**Working Holiday** (`src/data/jp/working-holiday.json`). Done. 16 requirements, all quoted from the MOFA
page. Worth knowing:

- The partner list is 32 countries and regions as of 1 April 2026. It is coded as a
  `nationality-list`, so the engine can answer it from the profile. Malta and Italy joined in 2026.
- Two age rules. 18 to 30 for everyone, and a lower 18 to 25 for Australia, Canada, South Korea and
  Ireland that can be extended to 30 by agreement. The second one is `manual`, because the engine has no
  way to apply an age limit to only some nationalities. **This is the clearest case for a new rule kind
  from stream E:** a per-nationality age limit.
- Most requirements are `manual` on purpose. Funds, health, intent and "never had one before" are things
  a person proves to an embassy, and the page does not give a number for the funds.
- The page says outright that requirements vary by nationality, which is recorded as its own requirement
  so the user sees it.

**Engineer / Specialist in Humanities / International Services**
(`src/data/jp/engineer-specialist.json`). Done. 11 requirements. The main graduate work route, and the
one that needed the most decisions:

- **The ISA page has no English version.** `?lang=en` serves the Japanese page. So every quote on this
  route is Japanese with an English `text` beside it, which is what the brief allows. The reviewer reads
  both on the review page.
- **The landing criteria are not on the HTML page.** The page describes the activity, the period of stay
  and the documents; the actual test (degree, ten years of experience, pay) is in the PDF it links as
  「該当する活動・上陸許可基準について」, which reproduces 上陸基準省令 verbatim. `fetch-source.ts` reads
  HTML only, so that one was extracted with `pdftotext` (no `-layout`: layout mode interleaves the
  table's left column into the criteria text) and saved into `.sources/jp-gijinkoku-kijun.txt` with the
  same header. Its seven sources carry `"check": "manual"`, so the weekly drift check skips them and a
  person re-reads the PDF when the route is verified.
- **The degree requirement is not blocking, on purpose.** The criteria are a choice of four: a related
  degree, a specialist course at a Japanese vocational school, ten years of practical experience, or a
  listed information-processing qualification. The engine has no "any one of these" rule kind, so
  blocking it would wrongly close the route for someone qualifying the other three ways. It is carried
  as a non-blocking `degree` check with the alternatives as their own requirements. **Second clear case
  for a new rule kind from stream E:** a group of requirements where one is enough.
- **The pay rule stays with the employer.** 「日本人が従事する場合に受ける報酬と同等額以上の報酬」 is a
  comparison to a Japanese national in the same job, not a figure, so there is no salary table here and
  nothing for `Profile.expectedSalary` to be checked against. It is `manual`, `who: "employer"`.
- Guessed, and worth a look when verifying: `professional-field` and
  `contract-with-organisation-in-japan` split one sentence of 入管法別表第一の二 into two requirements,
  because a user has to check two different things (is the work professional, and is there a contract).
- The page gives the period of stay as ５年、３年、１年又は３月. There is nowhere in the schema to put
  it, so it is not in the route file. Worth a field one day; the UI has no way to show it now.

**The CEFR B2 rule (from 15 April 2026).** On the route as two dated requirements,
`language-b2-customer-facing` and `language-b2-already-met`, both `effective.from: "2026-04-15"`.

- The rule is on the route's own ISA page, in the 【お知らせ】 block, so no separate page was needed and
  the Reddit post was not used for anything. Applications from 令和８年４月１５日 to a Category 3 or 4
  employer, for work that mainly uses language skills with people, have to include proof of CEFR B2 in
  the language used at work. JLPT N2, BJT 400, twenty years' residence or a Japanese education count as
  B2 **Japanese**; the main rule is about whatever language the job uses, which is not always Japanese.
- The date is in `effective.from` and not in the requirement text. `令和８年` is Reiwa 8, and nothing on
  the page writes 2026, so a text saying "2026" could not be grounded in a quote. The UI gets the date
  from `effective` instead.
- The rule started five months ago, so it is already in effect rather than an upcoming change. The
  engine still needs the date, so that an application dated before it is evaluated without the rule.

**Two things the grounding check cannot see.** `scripts/numbers.ts` now folds full-width digits into
their ASCII form for both `check:data` and the review page, so ＣＥＦＲ・Ｂ２ grounds "B2" and
カテゴリー３ grounds "Category 3". It still does not read kanji numerals, so 十年 and 三年 are written
out as "ten years" and "three years" in the requirement text: **the reviewer has to check those two by
eye, because no automatic check covers them.**

**J-Find, the Future Creation Individual visa** (`src/data/jp/jfind.json`). Done. 9 requirements. A
job-hunting visa with no employer, which makes it one of the few routes a graduate can start on their
own.

- **The ISA page is much better than the MOFA one and is now the primary source.** MOFA only says
  "an eligible university (PDF)". ISA gives the actual test: top 100 in two or more of three world
  rankings (QS, THE, and Shanghai's ARWU), a degree awarded within the last five years, and savings of
  ２０万円. The route's `officialUrl` is the ISA page.
- ISA also publishes an English outline PDF, which is where the figures "200,000 yen" and "5 years"
  come from in ASCII. The Japanese page writes them ２０万円 and ５年, which fold to "20" and "5", so
  the yen figure needed the English source to ground at all.
- The university-list PDF is quoted and marked `"check": "manual"`, per the default agreed for this
  batch. Two quotes only, its title and "As of January 2026", because the list itself is nearly 700
  lines and the route asks the user to check it rather than reproducing it. The list is a snapshot; ISA
  says on the page to check the current three rankings as well, which is its own requirement.
- **No Indonesian university is on the list**, and that is not a data gap, it is the rule. J-Find is
  closed to most Indonesian graduates and open to graduates of the same ranked universities whatever
  their nationality, which is a good example of why the route data is keyed on the university and not
  on where you are from.
- The five-year window is `manual`. `Profile.graduationYear` exists but the engine has no rule kind for
  "within N years of graduating". **Third case for stream E**, and the easiest of the three.
- Age 18 or older is the one condition only MOFA states, so that requirement carries the MOFA source.

**⚠️ MOFA is returning 403 to the fetcher, for the whole site.** It started today, part way through this
stream: `check:sources` reached the working-holiday page on the first run and got 403 on every later
one, including `https://www.mofa.go.jp/index.html`. A browser user agent, a Referer, HTTP/1.1 and a
cookie jar all still get 403, so it looks like an IP block rather than a header check, and probably one
the drift check earned by fetching the same page repeatedly. Effects:

- Every quote on `jp-working-holiday` (16 sources) and the age rule on `jp-jfind` reads as `unreachable`,
  so the weekly job fails and opens an issue for a page that has not actually changed.
- Nothing is wrong with the data. The quotes were taken while the page was reachable and are still in
  `.sources/jp-working-holiday.txt` and `.sources/jp-jfind-mofa.txt`.
- For stream C to decide: wait it out, slow the fetcher down, or treat a 403 differently from a missing
  quote in the report. Marking these sources `"check": "manual"` would silence it, but that flag is for
  pages the fetcher cannot read, not for pages that have blocked us, so it would hide a real problem.

## Still to do

**Highly Skilled Professional.** The MOFA page is thin: period of stay 5 years, and the documents. The
points table itself is on ISA pages that MOFA links to in Japanese, plus PDFs. So this route needs
either a Japanese-language source quoted verbatim or PDF sources marked `"check": "manual"`, and the
points test itself needs a new rule kind from stream E. Until then its points requirement has to be
`manual`.

**Designated Activities for job hunting.** Not yet checked. The brief's guess is that it is only for
graduates of Japanese universities, which would put it out of scope for someone applying from abroad. If
that is right it goes in this file with the reason and gets no route file.

## Questions for Joshua

1. ~~J-Find's university list is a PDF. Do we quote the PDF and mark the source `manual`, or link the
   list and leave the whole condition to the applicant?~~ Went with quoting the PDF and marking it
   `manual`, on the default agreed for this batch. Only the title and the date are quoted, so there is
   very little to go stale, and the requirement still tells the user to check the live rankings.
2. The Highly Skilled Professional points table only exists in Japanese in a form we can quote. Are you
   happy to verify a Japanese quote with an English `text` beside it? You can read it against the source,
   the review page shows both.
3. Working Holiday is not really a graduate work route. It is in because it is genuinely open to young
   people with no employer, which is rare, but it should probably read differently on the results page.
