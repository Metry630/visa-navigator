# Stream D: discovery from public posts

**Goal.** Decide the target nationalities and what the results page should lead with, from evidence,
without messaging anyone.

**Owns.** `research/discovery/`: `posts.csv`, `summary.md`, `reply-candidates.md`.

**Sources.**
- **Automatic:** WebSearch (surfaces TeamBlind, Hacker News, forums, blogs and some public LinkedIn posts),
  WebFetch on those pages (TeamBlind threads read without login), and the Hacker News search API
  (`https://hn.algolia.com/api/v1/search?query=...`; it works but is thin for this topic).
- **Through Joshua's Chrome** (claude-in-chrome extension): Reddit, X and LinkedIn search. Reddit's public
  API returns 403 without login and WebSearch doesn't index Reddit. **Checkpoint:** before the browser part,
  push-notify Joshua to open Chrome logged in to the three sites and approve them. LinkedIn: 5 searches at
  most, since it restricts accounts it thinks are automated.
- **Official statistics** for the nationality mix: Japan's residence-status statistics by nationality
  (e-Stat or the Immigration Services Agency), and Singapore's if MOM publishes them.

**Keyword grid.** destination × route × nationality, for example "employment pass fresh grad India",
"COMPASS fresh graduate", "Japan engineer visa bachelor Vietnam", "J-Find visa", "working holiday Japan
Philippines", "S Pass fresh graduate".

**Coding (`posts.csv`).** url, platform, date, destination, route, nationality (if stated), question (one
paraphrased line), confusion, replies_wrong_or_outdated (yes / no / unclear). Never store usernames or long
quotes. Model summaries are fine here, unlike rule data.

**Output (`summary.md`).** Posts coded, by platform; the nationality mix; the top five confusions with
counts; the recommended target nationalities (3+ non-Indonesian plus Indonesia) with the evidence behind
each; and the limits (vocal-poster bias, and it says nothing about willingness to pay).

**Also.** `reply-candidates.md`: 5 to 10 threads where a clear, sourced answer would help. Joshua may reply
to these later, himself. Never post anything.

**Stop** at about 100 coded posts. **Land** with `scripts/land.sh`.
