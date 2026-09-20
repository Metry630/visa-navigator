// What the rules mean for one person, computed from the rules themselves.
//
// The checklist says what every requirement is. It does not say what to do about them, and for six
// of the ten routes the verdict is permanently "depends on an employer", because that is the truth
// about work visas rather than a gap in the data. So the page needs something to say when the
// verdict cannot say anything.
//
// The bar every insight here has to clear:
//
//   1. **Computed, never generated.** Each one is a function of the route data and the profile. No
//      model writes a word of it, at build time or at run time.
//   2. **It names its sources.** `from` carries the exact requirements it was derived from, with
//      their quotes, so a reader can check the reasoning against the official page. An insight that
//      cannot cite is a guess, and a guess loses the only advantage this site has over a forum.
//   3. **It disappears with its data.** Every derivation looks its requirements up by id and returns
//      nothing when they are missing. Deleting a requirement deletes the sentence that rested on it,
//      rather than leaving a claim with nothing behind it.
//   4. **It is a consequence, not an instruction.** "An employer where your nationality is already a
//      large share scores lower here" is a reading of the rule. "Apply to startups" is advice this
//      data cannot support, and it does not belong here.
import { floorForAge, formatMoney, inEffect } from "./evaluate";
import type { Requirement, Route } from "./schema";
import type { Destination, Insight, InsightFrom, Profile } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2027-01-01" becomes "1 Jan 2027".
 *
 * The engine normally keeps dates as YYYY-MM-DD and lets the UI format them, but an insight is a
 * finished sentence rather than a field, so the date has to be readable before it leaves here.
 * Matches `formatDate` in the UI on purpose; if that format ever changes, change both.
 */
function formatDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** Where a sentence came from, so the reader can check it. */
function from(route: Route, req: Requirement): InsightFrom {
  return {
    routeId: route.id,
    routeName: route.name,
    requirementId: req.id,
    requirementText: req.text,
    sources: req.sources,
  };
}

function requirement(route: Route | undefined, id: string): Requirement | undefined {
  return route?.requirements.find((r) => r.id === id);
}

/**
 * The qualifying salary for this person's age, now and after a dated change.
 *
 * The published tables are the same for everyone; the row that applies is not, and neither is the
 * date it changes. Someone who is 26 and whose application slips from December into January needs
 * S$455 a month more than they did, which a table on a government page will not tell them.
 */
function salaryFloorChanges(routes: Route[], profile: Profile, asOf: string): Insight[] {
  const out: Insight[] = [];
  for (const route of routes) {
    const floors = route.requirements.filter((r) => r.kind === "salary-floor");
    const now = floors.find((r) => inEffect(r, asOf) && r.who === "you");
    const later = floors.find(
      (r) => r.who === "you" && r.effective?.from && r.effective.from > asOf,
    );
    if (!now || !later || now.kind !== "salary-floor" || later.kind !== "salary-floor") continue;

    const nowAmount = floorForAge(now.byAge, profile.age);
    const laterAmount = floorForAge(later.byAge, profile.age);
    if (nowAmount === laterAmount) continue;

    const changesOn = later.effective?.from;
    if (!changesOn) continue;

    const rise = laterAmount - nowAmount;
    const per = now.period === "month" ? "a month" : "a year";
    out.push({
      id: `${route.id}-salary-floor-change`,
      kind: "salary-floor-change",
      text:
        `At ${profile.age} the qualifying salary for the ${route.name} is ` +
        `${formatMoney(nowAmount, now.currency)} ${per} today and ` +
        `${formatMoney(laterAmount, later.currency)} ${per} from ${formatDay(changesOn)}, ` +
        `${formatMoney(Math.abs(rise), now.currency)} ${rise > 0 ? "more" : "less"}. ` +
        `The figure that applies is the one in force when the application is made.`,
      from: [from(route, now), from(route, later)],
    });
  }
  return out;
}

/**
 * Singapore: who your prospective employer already employs changes your score.
 *
 * COMPASS scores the employer as well as the candidate, and one criterion is the share of the
 * employer's professional staff who share your nationality. That makes the same candidate worth
 * different points at different companies, which is not something a checklist can express.
 */
function employerDiversity(routes: Route[], nationalityNames: string[]): Insight[] {
  const ep = routes.find((r) => r.id === "sg-employment-pass");
  const diversity = requirement(ep, "compass-diversity");
  const points = requirement(ep, "compass-40-points");
  if (!ep || !diversity) return [];

  // countries.json holds country names, not demonyms, and there is no reliable way to turn
  // "Philippines" or "United Arab Emirates" into one. So the sentence is built to read correctly
  // with a plain country name in brackets rather than inflected into the prose.
  const who = nationalityNames.length ? ` (${nationalityNames.join(" or ")})` : "";

  return [
    {
      id: "sg-employer-diversity",
      kind: "employer-size",
      text:
        `The same application can score differently at different employers. One COMPASS criterion is ` +
        `the share of an employer's professional staff who share your nationality, and a small share ` +
        `earns more points, so an employer whose staff already largely share your nationality${who} ` +
        `scores lower on it than one where that is rare. Firms with fewer than 25 such staff get a ` +
        `default score instead. It is worth asking before you apply.`,
      from: [from(ep, diversity), ...(points ? [from(ep, points)] : [])],
    },
  ];
}

/**
 * Japan: the same question, and the answer runs the other way.
 *
 * ISA sorts employers into four categories by how established they are, and a smaller or newer
 * employer lands lower, which since April 2026 means more documents and a language requirement. So
 * employer size helps in one country and costs in the other, which is the kind of thing you only
 * see with both schemes in front of you.
 */
function employerCategory(routes: Route[], asOf: string): Insight[] {
  const es = routes.find((r) => r.id === "jp-engineer-specialist");
  const definitions = requirement(es, "employer-category-definitions");
  const language = requirement(es, "language-b2-customer-facing");
  if (!es || !definitions) return [];

  const languageApplies = language && inEffect(language, asOf);
  const sg = routes.find((r) => r.id === "sg-employment-pass");
  const diversity = requirement(sg, "compass-diversity");

  return [
    {
      id: "jp-employer-category",
      kind: "employer-size",
      text:
        `How established the employer is changes the application. A company listed on a Japanese ` +
        `stock exchange is Category 1, while an employer that matches none of the higher categories ` +
        `is Category 4, so a newer or smaller company usually sits lower.` +
        (languageApplies
          ? ` Category 3 and 4 applications need extra documents, and proof of CEFR B2 ability in the ` +
            `language you use at work when the job is mainly customer-facing.`
          : "") +
        (diversity
          ? ` Singapore works the other way: there a smaller share of your own nationality among an ` +
            `employer's professional staff earns more COMPASS points.`
          : ""),
      from: [
        from(es, definitions),
        ...(languageApplies && language ? [from(es, language)] : []),
        ...(sg && diversity ? [from(sg, diversity)] : []),
      ],
    },
  ];
}

/**
 * Every insight for one destination, ordered by how much they are worth reading.
 *
 * Takes **all** routes rather than one destination's, because the Japan employer insight cites
 * Singapore's COMPASS rule to show that employer size cuts the other way there. Filtering to the
 * destination before calling this would silently drop that half.
 */
export function insightsFor(
  allRoutes: Route[],
  destination: Destination,
  profile: Profile,
  asOf: string,
  nationalityNames: string[],
): Insight[] {
  const mine = allRoutes.filter((r) => r.destination === destination);
  return [
    ...salaryFloorChanges(mine, profile, asOf),
    ...(destination === "SG" ? employerDiversity(allRoutes, nationalityNames) : []),
    ...(destination === "JP" ? employerCategory(allRoutes, asOf) : []),
  ];
}
