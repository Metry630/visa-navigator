// Deterministic rule evaluation. No visa fact is produced here that isn't in a route file.
import type { Requirement, Route } from "./schema";
import type {
  ChecklistItem,
  Destination,
  MissingField,
  Outcome,
  Profile,
  RequirementRule,
  RouteResult,
  RouteStatus,
} from "./types";

const DEGREES = ["none", "diploma", "bachelor", "master", "doctorate"] as const;
const LEVELS = ["basic", "conversational", "business", "native"] as const;

/** How far ahead a dated rule change is announced on a route card. */
const UPCOMING_WINDOW_DAYS = 400;

export function inEffect(req: Requirement, asOf: string): boolean {
  const from = req.effective?.from;
  const to = req.effective?.to;
  return (!from || asOf >= from) && (!to || asOf <= to);
}

/** Rows are sorted by age; the first row also covers younger ages and the last row older ones. */
export function floorForAge(byAge: { age: number; amount: number }[], age: number): number {
  const first = byAge[0];
  if (!first) throw new Error("salary table is empty");
  let amount = first.amount;
  for (const row of byAge) if (age >= row.age) amount = row.amount;
  return amount;
}

export function formatMoney(amount: number, currency: "SGD" | "JPY"): string {
  return (currency === "SGD" ? "S$" : "¥") + amount.toLocaleString("en-US");
}

/** The typed part of a requirement, copied out for the UI. Nothing is derived. */
export function ruleOf(req: Requirement): RequirementRule {
  switch (req.kind) {
    case "salary-floor":
      return {
        kind: "salary-floor",
        currency: req.currency,
        period: req.period,
        sector: req.sector,
        byAge: req.byAge.map((row) => ({ age: row.age, amount: row.amount })),
      };
    case "age":
      return {
        kind: "age",
        ...(req.min !== undefined ? { min: req.min } : {}),
        ...(req.max !== undefined ? { max: req.max } : {}),
      };
    case "degree":
      return { kind: "degree", minLevel: req.minLevel };
    case "nationality-list":
      return {
        kind: "nationality-list",
        mode: req.mode,
        listName: req.listName,
        codes: [...req.codes],
      };
    case "experience":
      return {
        kind: "experience",
        ...(req.minYears !== undefined ? { minYears: req.minYears } : {}),
        ...(req.maxYears !== undefined ? { maxYears: req.maxYears } : {}),
      };
    case "language":
      return { kind: "language", code: req.code, minLevel: req.minLevel };
    case "manual":
      return { kind: "manual" };
  }
}

/**
 * The two sectors Singapore writes separate salary floors for, and how to say each one in a note.
 * A floor written against any other sector applies to everyone, which is the case for Japan.
 */
const SECTOR_TEXT: Record<string, string> = {
  "financial-services": "in financial services",
  "all-except-financial-services": "outside financial services",
};

/** A type predicate, so narrowing survives the call and `sector` stays reachable. */
function isSectorSpecific(req: Requirement): req is Extract<Requirement, { kind: "salary-floor" }> {
  return req.kind === "salary-floor" && req.sector in SECTOR_TEXT;
}

/**
 * Whether the reader's nationalities put them inside a requirement's declared scope.
 *
 * A dual national counts as being on a list if either nationality is, because we cannot know which
 * passport they would apply under, and the safer reading is the one that does not decide for them.
 */
function inNationalityScope(req: Requirement, profile: Profile): boolean {
  const scope = req.appliesTo?.nationalities;
  if (!scope) return true;
  const listed = profile.nationalities.some((n) => scope.codes.includes(n));
  return scope.mode === "only" ? listed : !listed;
}

/**
 * Whether a requirement applies to this person at all.
 *
 * Singapore's Employment Pass and S Pass each carry two salary floors, one for financial services
 * and one for everything else, and only one of them can be true of any given job. Until this was
 * read, both were evaluated against everyone: somebody outside financial services was shown a red
 * mark on a rule whose own text excludes them, and somebody inside it was shown a green one on the
 * blocking floor that excludes them, which is the worse direction.
 *
 * While the answer is unknown both stay, so the results page can ask. Once it is known the one that
 * does not apply is dropped from the checklist entirely, the same way a rule that is out of date is.
 */
export function appliesToSector(req: Requirement, profile: Profile): boolean {
  if (!isSectorSpecific(req)) return true;
  if (profile.financialServices === undefined) return true;
  return profile.financialServices === (req.sector === "financial-services");
}

/** Every applicability test in one place, so a new one cannot reach only half the callers. */
export function applies(req: Requirement, profile: Profile): boolean {
  return appliesToSector(req, profile) && inNationalityScope(req, profile);
}

function checkRequirement(
  req: Requirement,
  profile: Profile,
  destination: Destination,
): { outcome: Outcome; note?: string; missing?: MissingField } {
  switch (req.kind) {
    case "salary-floor": {
      const floorAmount = floorForAge(req.byAge, profile.age);
      const floor = formatMoney(floorAmount, req.currency);
      const expected = profile.expectedSalary?.[destination];
      if (expected === undefined) {
        // The only requirement in the engine that is unknown purely for want of an answer. Naming
        // the field lets the results page ask for it here rather than sending anyone back to a form.
        return {
          outcome: "unknown",
          note: `At your age the minimum is ${floor} a ${req.period}.`,
          missing: "expectedSalary",
        };
      }
      if (isSectorSpecific(req) && profile.financialServices === undefined) {
        // The salary is known, so the only thing left is which of the two floors governs this job.
        return {
          outcome: "unknown",
          note: `At your age the minimum is ${floor} a ${req.period} for jobs ${SECTOR_TEXT[req.sector]}.`,
          missing: "financialServices",
        };
      }
      const mine = formatMoney(expected, req.currency);
      return expected >= floorAmount
        ? { outcome: "met", note: `Your expected ${mine} meets the ${floor} minimum for your age.` }
        : {
            outcome: "unmet",
            note: `Your expected ${mine} is below the ${floor} minimum for your age.`,
          };
    }
    case "age": {
      const ok =
        (req.min === undefined || profile.age >= req.min) &&
        (req.max === undefined || profile.age <= req.max);
      return { outcome: ok ? "met" : "unmet" };
    }
    case "degree":
      return {
        outcome: DEGREES.indexOf(profile.degree) >= DEGREES.indexOf(req.minLevel) ? "met" : "unmet",
      };
    case "nationality-list": {
      const listed = profile.nationalities.some((n) => req.codes.includes(n));
      return { outcome: listed === (req.mode === "allow") ? "met" : "unmet" };
    }
    case "experience": {
      const y = profile.yearsExperience;
      const ok =
        (req.minYears === undefined || y >= req.minYears) &&
        (req.maxYears === undefined || y <= req.maxYears);
      return { outcome: ok ? "met" : "unmet" };
    }
    case "language": {
      const mine = profile.languages.find((l) => l.code === req.code);
      const ok = mine !== undefined && LEVELS.indexOf(mine.level) >= LEVELS.indexOf(req.minLevel);
      return { outcome: ok ? "met" : "unmet" };
    }
    case "manual":
      return { outcome: "unknown" };
  }
}

function daysBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86_400_000;
}

export function evaluateRoute(route: Route, profile: Profile, asOf: string): RouteResult {
  const active = route.requirements.filter((r) => inEffect(r, asOf) && applies(r, profile));
  const checked = active.map((req) => ({
    req,
    ...checkRequirement(req, profile, route.destination),
  }));

  const checklist: ChecklistItem[] = checked.map(({ req, outcome, note, missing }) => ({
    requirementId: req.id,
    text: req.text,
    who: req.who,
    outcome,
    ...(note ? { note } : {}),
    ...(missing ? { missing } : {}),
    rule: ruleOf(req),
    sources: req.sources,
  }));

  const blocking = checked.filter((c) => c.req.blocking);
  const failed = blocking.find((c) => c.outcome === "unmet");
  let status: RouteStatus;
  let reason: string;
  if (failed) {
    status = "closed";
    reason = failed.note ?? failed.req.text;
  } else if (!route.requiresEmployer && blocking.every((c) => c.outcome === "met")) {
    status = "open";
    reason = "You meet every requirement that can be checked from your answers.";
  } else {
    status = "depends";
    reason = route.requiresEmployer
      ? "An employer has to apply for you, and some checks depend on the job and the company."
      : "Some requirements can't be checked from your answers yet.";
  }

  const upcomingChanges = route.requirements.flatMap((r) => {
    const from = r.effective?.from;
    return from && from > asOf && daysBetween(asOf, from) <= UPCOMING_WINDOW_DAYS
      ? [{ on: from, text: r.text }]
      : [];
  });

  return {
    routeId: route.id,
    destination: route.destination,
    name: route.name,
    status,
    reason,
    checklist,
    upcomingChanges,
    verifiedOn: route.verified?.on ?? null,
    requiresEmployer: route.requiresEmployer,
  };
}
