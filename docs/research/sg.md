# Singapore routes

Every Singapore work pass considered for the app, in or out, with the reason. The list of passes comes
from MOM's own index at https://www.mom.gov.sg/passes-and-permits, so nothing is missing because nobody
thought of it.

Nothing here is verified. Every route file has `verified: null` until Joshua stamps it in the review page.

## In the app

| Route | File | Why it is in |
|---|---|---|
| Employment Pass | `src/data/sg/employment-pass.json` | The main professional route. Added before this stream. |
| S Pass | `src/data/sg/s-pass.json` | The professional route below the EP salary floor, open to all nationalities. |
| Work Holiday Pass (Work Holiday Programme) | `src/data/sg/work-holiday-pass.json` | Explicitly for students and young graduates, 18 to 25, no job offer needed first. |
| Work Holiday Pass (Work and Holiday Visa Programmes) | `src/data/sg/work-and-holiday-pass.json` | The Australian and New Zealander version, 18 to 30, 12 months instead of 6. |
| Training Employment Pass | `src/data/sg/training-employment-pass.json` | Marginal but real: a graduate sent by an employer's foreign office can use it. Capped at 3 months and not renewable, which the summary says. |
| EntrePass | `src/data/sg/entrepass.json` | Open to all nationalities and a genuine route for a graduate who founds a company, though the funding and IP bars are high. Every requirement is `manual`. |

## Left out, with the reason

| Route | Why it is out |
|---|---|
| Overseas Networks & Expertise Pass (ONE Pass) | Needs "a fixed monthly salary of at least S$30,000, or its equivalent in foreign currency, for the 12 consecutive months leading up to the date of application", or outstanding achievements in sports, arts and culture, or academia and research. No new graduate meets either. |
| Tech.Pass | Needs "a last drawn fixed monthly salary (in the last 1 year) of at least S$22,500", and it is closing anyway: "From 28 January 2027, MOM/EDB will no longer accept new and renewal Tech.Pass applications." Administered by EDB, not MOM. |
| Personalised Employment Pass | Needs a fixed monthly salary of at least $22,500, benchmarked to the top 10% of EP holders, and for overseas applicants that salary must have been drawn in the past 6 months. Out of reach for a new graduate. |
| Work Permit for migrant worker | Semi-skilled work in construction, manufacturing, marine shipyard, process or services, restricted by approved source country and by sector. Not a graduate professional route, and the nationality rules are a separate research job. |
| Work Permit for migrant domestic worker, confinement nanny, performing artiste | Specific occupations, not graduate work. The performing artiste scheme has ceased for new applications. |
| Training Work Permit | MOM's own page calls it "meant for semi-skilled or unskilled foreign trainees". The Training Employment Pass is the professional equivalent and is already in. |
| Dependant's Pass, Long-Term Visit Pass, Letters of Consent | Family routes. They depend on a relative's pass or citizenship, not on the user's own profile. |
| Miscellaneous Work Pass | Foreign speakers, religious workers and journalists on assignments of up to 60 days. |
| Work Pass Exempt Activities | Short-term activities without a pass, not employment. |
| Work pass exemption for foreign students | Only for people already holding an ICA Student's Pass and studying full-time in Singapore. Our users are graduating abroad. |
| Work passes for ICA Long-Term Visit Pass holders | Depends on marriage to a Singaporean or PR, or accompanying a child studying in Singapore. |

## Needs a new kind (for stream E)

Three rules are written as `"kind": "manual"` because the schema cannot express them yet. Each one is a
real check that the engine could make from the profile.

1. **University country list.** The Work Holiday Programme turns on where your university is, not on your
   nationality: Australia, France, Germany, Hong Kong, Japan, Netherlands, New Zealand, Switzerland,
   United Kingdom or United States. `nationality-list` is the wrong test, and `Profile` has `university`
   as free text with no country. Needs a country field on the profile and a `university-country-list`
   kind. Until then `sg-work-holiday-pass#university-country` is manual and blocking, so the route shows
   as "depends" rather than wrongly open.
2. **Degree or partial study.** The Work and Holiday Visa Programmes accept "a university degree, or the
   equivalent of two years of full-time undergraduate university study". The `degree` kind cannot say
   "or two years of study", and using `minLevel: "diploma"` would wrongly close the route for someone
   with two years of study and no qualification. `sg-work-and-holiday-pass#degree-or-two-years` is manual.
3. **Flat salary floor with no age table.** The Training Employment Pass floor is a flat S$3,000 with no
   age ladder. `salary-floor` requires a `byAge` table, and `check:data` insists every row's age appears
   in a quote, which a flat floor cannot satisfy. Either allow `byAge` to be omitted in favour of a single
   `amount`, or stop requiring the age of a single-row table to be quoted.
   `sg-training-employment-pass#salary-or-institution` is manual until then.

## Questions for Joshua while verifying

1. **S Pass tables.** All 92 S Pass figures were parsed out of MOM's own table text by script, not typed
   by hand, so a misread would be systematic rather than one bad cell. Spot-check three rows in each of
   the four tables (all sectors and financial services, current and from 1 Jan 2027) against the page.
2. **Sector wording.** The EP file and the S Pass file both use `sector: "all-except-financial-services"`.
   MOM writes it as "All (except financial services)". Worth confirming that the two passes really use the
   same sector split before any UI shows the sector.
3. **Should the Training Employment Pass be in at all?** It is a training pass, up to 3 months, not
   renewable, and the student path needs the attachment to be part of a course of study. It is in because
   a graduate employed by an overseas subsidiary can genuinely use it. Say if you would rather it went.
4. **Should EntrePass be in at all?** Same question from the other side. It is a founder route, not an
   employment route, and every requirement is manual, so the card will show a checklist and no verdict.
5. **Work Permit for migrant workers.** It is out because it is semi-skilled and source-country
   restricted, but the source-country lists are nationality rules and this product is about nationality.
   Decide whether a later version covers it.
6. **Dual nationals.** `sg-work-and-holiday-pass` matches if either nationality is AU or NZ, which is how
   the engine treats every nationality list. MOM's page says "You are a citizen of Australia or New
   Zealand" and says nothing about dual citizens. Worth a check with MOM's FAQ before this one is stamped.
7. **Work Holiday Programme capacity.** The 2,000-holder cap is recorded as a non-blocking requirement the
   authority decides. There is no published live count, so the app cannot tell a user whether places are
   free. Confirm that saying so is enough.
8. **"Acceptable institution" and "accredited institution".** Both the Training Employment Pass and the
   S Pass qualification rules point at lists inside MOM's application form rather than at a public page.
   Neither is quotable, so both are described in general terms. Check the wording reads honestly.
