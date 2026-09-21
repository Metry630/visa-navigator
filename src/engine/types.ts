// The contract between the engine and the UI. The engine owns this file; the UI only imports it.

export type Destination = "SG" | "JP";

export type DegreeLevel = "none" | "diploma" | "bachelor" | "master" | "doctorate";

export type LanguageLevel = "basic" | "conversational" | "business" | "native";

export interface Profile {
  /** ISO 3166-1 alpha-2 codes, one or two, e.g. ["IN"] or ["ID", "AU"] */
  nationalities: string[];
  age: number;
  degree: DegreeLevel;
  university?: string;
  graduationYear?: number;
  field?: string;
  yearsExperience: number;
  /** ISO 639-1 code, e.g. "en" or "ja" */
  languages: { code: string; level: LanguageLevel }[];
  /** SGD per month for SG, JPY per year for JP */
  expectedSalary?: Partial<Record<Destination, number>>;
  /**
   * Whether they already have a job offer. Nothing evaluates this: it decides which routes are worth
   * reading first, because six of the ten need an employer to apply and those are unreachable
   * without one.
   */
  hasOffer?: boolean;
  /**
   * Whether the job is in financial services.
   *
   * Singapore writes two salary floors for the Employment Pass and the S Pass, one for financial
   * services and one for everything else, and which of them applies is not something the engine can
   * infer. While this is undefined both floors report `unknown` rather than guessing, which is what
   * `missing: "financialServices"` exists to ask about.
   */
  financialServices?: boolean;
  /**
   * ISO 3166-1 alpha-2 country of the university, when there is one. Collected but not yet
   * evaluated. It is the missing fact behind `sg-work-holiday-pass#university-country`, which turns
   * on where the university is rather than on nationality, and which stays `manual` until a rule
   * kind can read this.
   */
  universityCountry?: string;
}

export type RouteStatus = "open" | "depends" | "closed";

/** Who has to check or prove a requirement. */
export type Checker = "you" | "employer" | "authority";

/** Whether a requirement is met for this profile, as far as the engine can tell. */
export type Outcome = "met" | "unmet" | "unknown";

export interface Source {
  url: string;
  publisher: string;
  /** YYYY-MM-DD */
  retrievedOn: string;
  /** Verbatim excerpt from the page, in the language the page is written in. */
  quote: string;
  /**
   * Unofficial literal English rendering, present whenever `quote` is not in English. Show it under
   * the quote, labelled as unofficial, never in place of it. Most Japan routes are sourced from
   * Japanese pages, so without this the route pages are unreadable to an English-speaking reader.
   */
  translation?: string | undefined;
}

/** A profile field whose absence is the only reason a requirement cannot be checked. */
export type MissingField = "expectedSalary" | "financialServices";

/**
 * The typed part of a requirement, passed through from the route file unchanged.
 *
 * It exists because a page rendering one requirement in full needs the structure behind the
 * sentence: a salary floor carries 23 rows of age and amount, and until now the only way the UI
 * could show that table was to print the quote the table was scraped from, which interleaves two
 * columns and reads as a run of numbers. Nothing here is computed.
 *
 * `RouteFacts` stays what it is, for comparing routes in a table; it is deliberately lossy. This is
 * for the opposite job, showing one requirement completely.
 */
export type RequirementRule =
  | {
      kind: "salary-floor";
      currency: "SGD" | "JPY";
      period: "month" | "year";
      /** e.g. "financial-services" or "all-except-financial-services". */
      sector: string;
      /** Sorted by age. The first row also covers younger ages, the last row also older ones. */
      byAge: { age: number; amount: number }[];
    }
  | { kind: "age"; min?: number; max?: number }
  | { kind: "degree"; minLevel: DegreeLevel }
  | { kind: "nationality-list"; mode: "allow" | "deny"; listName: string; codes: string[] }
  | { kind: "experience"; minYears?: number; maxYears?: number }
  | { kind: "language"; code: string; minLevel: LanguageLevel }
  | { kind: "manual" };

export interface ChecklistItem {
  requirementId: string;
  /** One plain-English sentence. */
  text: string;
  who: Checker;
  outcome: Outcome;
  /** Optional sentence specific to this profile. */
  note?: string;
  /**
   * The profile field that would settle this item, when one would.
   *
   * Only set where a requirement is `unknown` purely because the profile does not carry the fact,
   * never for a `manual` requirement, which no answer can settle. It exists so the results page can
   * ask for the missing answer beside the line it would change without the UI having to know which
   * rules read which fields.
   */
  missing?: MissingField;
  /** The typed rule behind this item, so the employer pack can render a salary table. */
  rule: RequirementRule;
  sources: Source[];
}

export interface RouteResult {
  routeId: string;
  destination: Destination;
  name: string;
  status: RouteStatus;
  /** One sentence explaining the status for this profile. */
  reason: string;
  checklist: ChecklistItem[];
  /** Dated rule changes that affect this route, e.g. a salary floor rising next January. */
  upcomingChanges: { on: string; text: string }[];
  /** YYYY-MM-DD, or null until a person has verified every requirement against its sources. */
  verifiedOn: string | null;
  /**
   * True when an employer has to apply on your behalf. Structural rather than a rule: it is what
   * separates the routes you can pursue alone from the ones that need an offer first.
   */
  requiresEmployer: boolean;
}

/** One requirement an insight was derived from, so a reader can check the reasoning. */
export interface InsightFrom {
  routeId: string;
  routeName: string;
  requirementId: string;
  /** The requirement's own sentence, unchanged. */
  requirementText: string;
  sources: Source[];
}

export type InsightKind = "salary-floor-change" | "employer-size";

/**
 * What the rules mean for this person, computed from the rules themselves.
 *
 * Every insight is a function of the route data and the profile. Nothing here is generated by a
 * model, and `from` is never empty: an insight that cannot cite the requirements behind it is a
 * guess, and not guessing is the site's only advantage over a forum. Show `text` with `from`
 * reachable beside it.
 */
export interface Insight {
  id: string;
  kind: InsightKind;
  text: string;
  from: InsightFrom[];
}

export interface DestinationResult {
  destination: Destination;
  name: string;
  routes: RouteResult[];
  /** May be empty. Ordered by how much they are worth reading. */
  insights: Insight[];
}

/**
 * The structured limits on a route, read straight off its typed requirements.
 *
 * It exists because the route library has to compare routes in a table, and the UI is not allowed to
 * author a visa fact. Every field here is a restatement of a rule that is already in the data with
 * its own sources, so the table can say "age 18 to 25" without anyone writing that sentence by hand.
 * Absent means the route has no requirement of that kind in effect, never that the fact is unknown:
 * of the ten routes, age constrains four, degree two, nationality lists two and salary floors two.
 *
 * Anything richer than this belongs on the route page, where the sources are.
 */
export interface RouteFacts {
  /** kind: "age". Either bound may be absent; at least one is present when the field is. */
  age?: { min?: number; max?: number };
  /** kind: "degree". The lowest degree the route accepts. */
  minDegree?: DegreeLevel;
  /**
   * kind: "nationality-list". Only how the list works and how long it is: the codes are on the route
   * page with the quote that backs them, and a count in a table cannot be mistaken for a decision.
   */
  nationalityList?: { mode: "allow" | "deny"; count: number };
  /**
   * kind: "salary-floor": the lowest floor in effect, taken from the first row of its table, which
   * is the floor for the youngest applicant. A route can carry one floor per sector and a dated
   * replacement for each, so this is the least a reader could qualify on today, not the only
   * figure. The sectors, the table by age and the dated changes are all on the route page.
   */
  salaryFloor?: { currency: "SGD" | "JPY"; amount: number; period: "month" | "year" };
  /**
   * How the route's requirements split by who has to settle them. This is the answer to the largest
   * single confusion in the discovery set, 21 of 99 posts: how much of this is out of my hands.
   * Counts the requirements in effect on the date asked about, before anything is narrowed to a
   * particular reader. `listRoutes` has no profile, so this is what the route library shows
   * everybody. A reader's own checklist can be shorter, never longer, by exactly the rules that do
   * not apply to them: a salary floor for the sector they are not in, or the working holiday age
   * limit for the four countries that have their own.
   */
  checks: { you: number; employer: number; authority: number };
}

export interface RouteSummary {
  routeId: string;
  destination: Destination;
  name: string;
  summary: string;
  verifiedOn: string | null;
  /**
   * True when an employer has to apply on your behalf. Same field as `RouteResult.requiresEmployer`
   * and carried here too, so the route library can separate the routes you can start alone from the
   * ones that need an offer first without evaluating a profile.
   */
  requiresEmployer: boolean;
  /** The route's structured limits, for comparing routes without reading each one. */
  facts: RouteFacts;
}

export interface RequirementView {
  id: string;
  text: string;
  who: Checker;
  /** The typed rule behind the sentence, for pages that render a requirement in full. */
  rule: RequirementRule;
  sources: Source[];
  /** YYYY-MM-DD bounds, when the requirement only applies for part of the time. */
  effective?: { from?: string; to?: string };
}

export interface RouteDetail extends RouteSummary {
  officialUrl: string;
  requirements: RequirementView[];
}
