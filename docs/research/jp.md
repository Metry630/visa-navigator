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

## Still to do

**Engineer/Specialist in Humanities/International Services.** The main graduate work route. The ISA page
is saved and is long (569 lines), so it needs reading in sections rather than in one go. Expect a degree
or experience requirement and a pay rule comparable to a Japanese national doing the same work.

**Highly Skilled Professional.** The MOFA page is thin: period of stay 5 years, and the documents. The
points table itself is on ISA pages that MOFA links to in Japanese, plus PDFs. So this route needs
either a Japanese-language source quoted verbatim or PDF sources marked `"check": "manual"`, and the
points test itself needs a new rule kind from stream E. Until then its points requirement has to be
`manual`.

**J-Find (Designated Activities, Future Creation Individual).** MOFA page is saved and readable. It gives
three conditions: a qualification from an eligible university at bachelor's, master's or PhD level, awarded
in the last 5 years, and savings of approximately 200,000 yen. The catch is that the list of eligible
universities is a PDF, so the university condition has to be `manual` with the PDF marked
`"check": "manual"`. Period of stay is 1 year with an extension to 2 years.

**Designated Activities for job hunting.** Not yet checked. The brief's guess is that it is only for
graduates of Japanese universities, which would put it out of scope for someone applying from abroad. If
that is right it goes in this file with the reason and gets no route file.

## Questions for Joshua

1. J-Find's university list is a PDF. Do we quote the PDF and mark the source `manual`, or link the list
   and leave the whole condition to the applicant? The second is less work and less likely to go stale.
2. The Highly Skilled Professional points table only exists in Japanese in a form we can quote. Are you
   happy to verify a Japanese quote with an English `text` beside it? You can read it against the source,
   the review page shows both.
3. Working Holiday is not really a graduate work route. It is in because it is genuinely open to young
   people with no employer, which is rare, but it should probably read differently on the results page.
