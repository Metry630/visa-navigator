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

export interface ChecklistItem {
  requirementId: string;
  /** One plain-English sentence. */
  text: string;
  who: Checker;
  outcome: Outcome;
  /** Optional sentence specific to this profile. */
  note?: string;
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
}

export interface DestinationResult {
  destination: Destination;
  name: string;
  routes: RouteResult[];
}

export interface RouteSummary {
  routeId: string;
  destination: Destination;
  name: string;
  summary: string;
  verifiedOn: string | null;
}

export interface RequirementView {
  id: string;
  text: string;
  who: Checker;
  sources: Source[];
  /** YYYY-MM-DD bounds, when the requirement only applies for part of the time. */
  effective?: { from?: string; to?: string };
}

export interface RouteDetail extends RouteSummary {
  officialUrl: string;
  requirements: RequirementView[];
}
