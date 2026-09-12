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
| `jp-hsp-isa.txt` | ISA, 高度人材ポイント制による出入国在留管理上の優遇制度 (index) |
| `jp-hsp-system.txt` | ISA, 高度人材ポイント制とは？ |
| `jp-hsp-evaluate.txt` | ISA, ポイント評価の仕組みは？ |
| `jp-hsp-preferential.txt` | ISA, どのような優遇措置が受けられる？ |
| `jp-hsp-leaflet-en.txt` | ISA, Points-Based Preferential Immigration Treatment (PDF, English) |
| `jp-student-jobhunting.txt` | ISA, 留学生の就職 |

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

**Highly Skilled Professional** (`src/data/jp/highly-skilled-professional.json`). Done. 11 requirements.
MOFA's page really is thin, so this is sourced from the four ISA pages on 高度人材ポイント制 plus the
English leaflet ISA publishes.

- **The points table could not be quoted at all, and that is the finding.** The ordinance version
  (評価項目・配点（法務省令）, `930001658.pdf`) is vertical Japanese, and `pdftotext` returns it one
  character per column, so nothing in it is quotable. The English leaflet is a two-page PDF whose first
  page is a flat image with no text layer, and whose second page is the table: its rows and their point
  values come out on separate lines and out of reading order, so a row's label and its score cannot be
  tied together from the text. A model could read the rendered page, but reading numbers off an image
  is exactly the step this project does not allow.
- So **no point value is in the data except the 70 total**, which comes from the ISA HTML page in
  Japanese (一定点数（７０点）) and is auto-checked. The route names what scores points, in the agency's
  own categories, and sends the user to the official table. That is less than we wanted and more than we
  can currently prove; if the table is worth encoding, it needs a person to transcribe it once and the
  review page to check it.
- Two quotes do come from the English leaflet, both whole sentences that survive extraction intact and
  were checked against the rendered page: the 3 million yen minimum salary, and the JLPT N1 bonus item.
  They carry `"check": "manual"`.
- **The 3 million yen floor is `manual`, not a `salary-floor`.** Two reasons, and the second is the
  interesting one. It is flat, with no age table, and `salary-floor` requires `byAge` rows. And the
  figure is written ３００万円 in Japanese, which the grounding check reads as "300", so an amount of
  3000000 could not be grounded against any Japanese source; only the English leaflet's "3 million yen"
  makes the sentence groundable at all, and "3 million" is not "3000000" either. **Fourth case for
  stream E:** a flat floor with no age band. Worth doing, since this is the only JP figure that could be
  compared against `Profile.expectedSalary`.
- Realistically this route is a stretch for a new graduate: a bachelor's degree and a first salary do
  not get near 70 without the bonus items. That belongs in the UI's framing rather than in the data, so
  nothing in the route file says it.

**Designated Activities for job hunting.** Out, with no route file. ISA files it under 留学生の就職 and
the guideline is titled 留学生の就職支援に係る「特定活動」（本邦大学等卒業者）についてのガイドライン:
本邦大学等卒業者 means graduates of universities **in Japan**. Someone applying from abroad cannot use
it, so it is out of scope for this product's user. J-Find is the equivalent for graduates of overseas
universities and is in.

## Still to do

Nothing in this stream. Every route in the brief is either a file in `src/data/jp/` or recorded above
with the reason it is out. What is left is verification, which is Joshua's stamp on the review page, and
the four rule kinds stream E would need to make the JP routes decide more from the profile:

1. A per-nationality age limit (Working Holiday).
2. A group of requirements where meeting one is enough (Engineer/Specialist's four ways in).
3. "Within N years of graduating" (J-Find).
4. A flat salary floor with no age table (Highly Skilled Professional).

## MOFA is blocking the fetcher (2026-09-12)

`npm run check:sources` came back with 21 unreachable quotes, every one of them on
https://www.mofa.go.jp/j_info/visit/w_holiday/index.html, all HTTP 403. It is not the user agent and not
that page: plain `curl` with a browser user agent gets 403 from https://www.mofa.go.jp/ itself, while MOM
returns 200 in the same run. So MOFA is refusing this network, and it started today, since the snapshot in
`.sources/jp-working-holiday.txt` was fetched successfully this morning.

Deliberately **not** marking those 21 sources `"check": "manual"`. That flag is for pages the fetcher can
never read, and using it here would quietly switch drift detection off for the whole route over what looks
like an IP block. The weekly cron will say whether it has lifted. If it is still 403 next week, the honest
move is `manual` on the MOFA sources plus a note on the route that the source has to be re-read by hand.

This does not block stream R-JP: snapshots for all four remaining Japan routes are already saved in
`visa-navigator-r-jp/.sources/`. It does mean a new MOFA page cannot be fetched until the block lifts.

## Resolved from the 2026-09-12 review

Joshua stamped `jp-working-holiday` and left one comment on it.

- **`funds-for-initial-stay`** ("I dont see them saying the embassy sets the reasonable amount"). Correct.
  MOFA says only "Possessing reasonable funds for the maintenance of his/her stay during the initial
  period of stay in Japan", and nothing about who sets the figure. The sentence attributing it to the
  embassy is gone; the text now says the page gives no figure. The embassy advice it was reaching for
  already has its own requirement, `requirements-vary-by-nationality`, with its own quote.

## Questions for Joshua

1. ~~J-Find's university list is a PDF. Do we quote the PDF and mark the source `manual`, or link the
   list and leave the whole condition to the applicant?~~ Went with quoting the PDF and marking it
   `manual`, on the default agreed for this batch. Only the title and the date are quoted, so there is
   very little to go stale, and the requirement still tells the user to check the live rankings.
2. ~~The Highly Skilled Professional points table only exists in Japanese in a form we can quote. Are you
   happy to verify a Japanese quote with an English `text` beside it?~~ Partly answered and partly
   overtaken. Japanese quote with English `text` is the pattern used on both the Engineer/Specialist and
   the Highly Skilled Professional routes, so you will be reading Japanese on the review page either
   way. The points table itself turned out not to be quotable from any machine-readable source at all,
   in Japanese or English, so the question that is left is a different one: **is 70 points and a list of
   what scores enough, or do you want the table transcribed by hand once and checked on the review
   page?** Hand transcription is the only way to get the numbers, and it is the kind of thing that goes
   stale.
3. Working Holiday is not really a graduate work route. It is in because it is genuinely open to young
   people with no employer, which is rare, but it should probably read differently on the results page.
   Left for stream U.
4. New: MOFA has blocked the fetcher (see above). It only affects `check:sources`, not the data or the
   app, but the weekly job will keep failing until someone decides what to do about it.
