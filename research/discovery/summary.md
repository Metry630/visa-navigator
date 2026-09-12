# Discovery: what people actually ask about SG and JP work visas

Coded 99 public posts on 2026-09-12. No one was messaged. Nothing here is a visa fact for the
product. Everything below is about what people ask, not about what the rules are.

## What was coded

| Platform | Posts | How it was read |
|---|---:|---|
| Reddit (r/movingtojapan, r/japanlife, r/askSingapore) | 51 | Joshua's logged-in Chrome |
| Blind | 44 | public, no login |
| Hacker News | 4 | Algolia search API |

Destinations: Singapore 53, Japan 44, both 2. Posts from 2025 or later: 42 of 99.

Routes named: Employment Pass 29, general sponsorship 20, Japan Engineer/Specialist in Humanities 20,
J-Find 7, working holiday 6, Dependant's Pass 5, S Pass 1, COMPASS 1.

## Nationality mix

Nationality was stated in only 36 of 99 posts, so this is weak evidence and should not be read as a
market size. Of those 36: India 10, United States 6, Malaysia 4, United Kingdom 3, France 2,
Mexico 2, Philippines 2, and one each from Cambodia, Canada, Germany, Indonesia, Ireland, Singapore
and an unspecified European country.

The split by destination matters more than the raw counts. Every India and Malaysia post was about
Singapore. Every Philippines, Mexico, France, Germany, Ireland and Canada post was about Japan. So
the two destinations draw from different pools, and a product covering both has to serve both.

## Top five confusions

Counts are posts whose coded confusion falls in each group. A post can fall in two groups, so these
do not sum to 99.

1. **Will this employer sponsor, and how much work is it for them (21).** The single largest group,
   in both countries. On the Japan side people are told "we can't sponsor work visas" by companies
   that have never tried, and the replies say the paperwork is a contract plus company documents. On
   the Singapore side it is the mirror image: candidates get no replies at all and do not know
   whether that is the rule, the quota, or the employer choosing not to bother.
2. **Will it be approved, and how long does it take (17).** People have an offer and cannot tell
   whether the pass is a formality or a real risk. Almost no one has a public data point on
   processing time, and one Japan post exists purely to contribute one.
3. **Is there any route that lets me enter and look for work (13).** Concentrated on Japan. In one
   thread a confident reply says no such status exists, and two other people correct it by naming
   J-Find. The J-Find questions are then about eligibility details: the university list, the five
   year window, savings, and whether the status already allows part-time work.
4. **Does my degree qualify (10).** Japan's Engineer/Specialist in Humanities visa, every time.
   Whether the degree has to relate to the job, whether a two year or online degree counts, and
   whether the ten years of experience alternative is a hard floor. Answers in the same thread
   contradict each other.
5. **What does the pass let me do once I have it (10).** Switching employers, side income, freelance
   work, the grace period after a layoff, and whether a Dependant's Pass holder can work at all.

A sixth group is worth naming even though it is smaller (8): Singapore salary thresholds, and the
belief that clearing the number means approval. Two posts describe a rejection at a high salary and
conclude that asking for less would have helped.

## How often replies are wrong or out of date

Coded yes for 29 of 99, no for 29, unclear for 41. The split by platform is stark: 22 of 44 Blind
threads versus 7 of 51 Reddit threads. Two things are mixed in there. Blind threads skew to 2019
through 2022, so a reply that was right then is wrong now, and Blind has no moderators correcting
rule claims. r/movingtojapan has regulars who answer with official links. So the honest reading is
that staleness, not ignorance, is what makes most of these replies wrong, which is exactly what a
"last verified on" date on every line is for.

Two examples that are worth keeping:

- A J-Find applicant was told at an embassy counter that roughly 11M yen in savings would help,
  against a published requirement far below that. Two other applicants in the thread were told
  different things by different consulates.
- A Singapore thread states as an unspoken rule that giving up PR blacklists you from a future work
  pass. Another reply correctly separates the two agencies involved.

## Recommended target nationalities

Indonesia plus **India, Malaysia and the Philippines**.

- **India (10 posts, all Singapore).** The largest stated group by a distance, and the one carrying
  the COMPASS diversity question, which is the question a rules engine answers better than a forum.
- **Malaysia (4 posts, all Singapore).** Adjacent, high volume in the real work-pass population, and
  the posts are about pass mechanics rather than whether to go, which is a better fit for a checklist.
- **Philippines (2 posts, both Japan).** Small in this sample, so this one is the weakest of the
  three. It is included because both posts are new graduates asking about Japan specifically, which
  is the exact user, and because the non-STEM degree question they raise is confusion group four.
- **Indonesia (1 post).** Required, and it is Joshua's own case.

Vietnam was in the keyword grid and returned nothing codeable, so it is not recommended despite the
usual assumption that it belongs in this list. That is worth rechecking against official statistics
before v0 ships.

## Limits

- **Vocal poster bias.** These are people who were confused enough to post in English on a public
  forum. The people who read the MOM or ISA page and got on with it are invisible here.
- **Nothing about willingness to pay.** No post in this set mentions paying for help. Several warn
  each other about agencies charging for job offers, which cuts the other way.
- **Sample is not balanced.** Blind skews mid-career and 2019 to 2022. Reddit skews Japan, because
  r/movingtojapan is far more active on visas than any Singapore subreddit.
- **English only.** Nothing was searched in Bahasa Indonesia, Vietnamese, Tagalog, Hindi or Japanese,
  which almost certainly suppresses the Southeast Asian nationality counts.
- **X and LinkedIn produced nothing.** X search errored repeatedly during the session. Two LinkedIn
  content searches returned only immigration consultants and job-repost accounts broadcasting, with
  no candidate questions, so LinkedIn was stopped at two of the five allowed searches.
- **Reddit rate limits.** Its API blocked the session part way through, so the rest was read from
  rendered pages. That capped the sample, not the method.

## One thing to act on outside this stream

r/movingtojapan post 1sgkv31 links the official ISA page for a rule change: from applications
submitted on or after 15 April 2026, Category 3 and 4 companies hiring for customer-facing work
requiring language skills must document CEFR B2 equivalent proficiency. That is a dated requirement
of exactly the shape the engine already models, and it belongs in the Japan data with its own
`effective.from`. It needs verifying against the ISA page itself, not against the Reddit post.
