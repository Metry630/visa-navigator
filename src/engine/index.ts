// The engine's public API. The UI imports only from here, as "@/engine".
import { z } from "zod";
import { evaluateRoute, inEffect } from "./evaluate";

import { insightsFor } from "./insights";
import { RouteSchema, type Requirement, type Route } from "./schema";
import type {
  Destination,
  DestinationResult,
  Profile,
  RouteDetail,
  RouteFacts,
  RouteSummary,
} from "./types";

export type * from "./types";

/**
 * Money formatting lives here so the currency symbol is written once. The route library renders
 * `RouteFacts.salaryFloor` and the results page renders the same figures from a checklist note; two
 * formatters would eventually disagree about a symbol or a thousands separator.
 */
export { formatMoney } from "./evaluate";

export const DESTINATIONS: { code: Destination; name: string }[] = [
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
];

/** Drops undefined values, since the contract uses exact optional properties. */
function definedOnly<T extends object>(obj: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}

// Data files load through Vite's glob so the same code runs in the app, in SSR and in Vitest.
const countries = z
  .array(z.object({ code: z.string().regex(/^[A-Z]{2}$/), name: z.string().min(1) }))
  .parse(
    Object.values(
      import.meta.glob("../data/countries.json", { eager: true, import: "default" }),
    )[0],
  );

// Every route file under src/data/<country>/ is picked up here; adding a route needs no code change.
export const ROUTES: Route[] = Object.entries(
  import.meta.glob("../data/*/*.json", { eager: true, import: "default" }),
)
  .map(([path, raw]) => {
    const parsed = RouteSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`Invalid route file ${path}: ${parsed.error.message}`);
    return parsed.data;
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const KNOWN_CODES = new Set(countries.map((c) => c.code));

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function evaluate(profile: Profile, asOf: string = today()): DestinationResult[] {
  const names = profile.nationalities
    .map((code) => countries.find((c) => c.code === code)?.name)
    .filter((n): n is string => Boolean(n));

  return DESTINATIONS.map((d) => {
    const forDestination = ROUTES.filter((r) => r.destination === d.code);
    return {
      destination: d.code,
      name: d.name,
      routes: forDestination.map((r) => evaluateRoute(r, profile, asOf)),
      insights: insightsFor(ROUTES, d.code, profile, asOf, names),
    };
  });
}

/**
 * Restates a route's typed requirements as the structured limits the route library compares on.
 *
 * Nothing is derived or inferred: each field is a value already in the route file, under a rule that
 * carries its own quote.
 *
 * Only requirements in effect on `asOf` are read, the same filter `evaluateRoute` applies, so the
 * counts here and the checklist there always agree. That filter is not cosmetic: the SG Employment
 * Pass carries both the 2026 salary floor and the one that replaces it on 1 Jan 2027, and taking
 * whichever came first in the file would keep quoting S$5,600 into a year when it is superseded.
 */
function facts(r: Route, asOf: string): RouteFacts {
  const active = r.requirements.filter((q) => inEffect(q, asOf));

  const checks = { you: 0, employer: 0, authority: 0 };
  for (const q of active) checks[q.who] += 1;

  const of = <K extends Requirement["kind"]>(kind: K) =>
    active.find((q): q is Extract<Requirement, { kind: K }> => q.kind === kind);

  const age = of("age");
  const degree = of("degree");
  const list = of("nationality-list");

  // A route can carry several floors at once, one per sector. The lowest is the one a reader could
  // qualify on, so it is the one the table means by "from".
  const salary = active
    .filter((q): q is Extract<Requirement, { kind: "salary-floor" }> => q.kind === "salary-floor")
    .map((q) => ({ req: q, lowest: q.byAge[0] }))
    .filter((x): x is { req: typeof x.req; lowest: { age: number; amount: number } } =>
      Boolean(x.lowest),
    )
    .sort((a, b) => a.lowest.amount - b.lowest.amount)[0];

  return {
    ...(age && (age.min !== undefined || age.max !== undefined)
      ? { age: definedOnly({ min: age.min, max: age.max }) }
      : {}),
    ...(degree ? { minDegree: degree.minLevel } : {}),
    ...(list ? { nationalityList: { mode: list.mode, count: list.codes.length } } : {}),
    ...(salary
      ? {
          salaryFloor: {
            currency: salary.req.currency,
            amount: salary.lowest.amount,
            period: salary.req.period,
          },
        }
      : {}),
    checks,
  };
}

function summary(r: Route, asOf: string): RouteSummary {
  return {
    routeId: r.id,
    destination: r.destination,
    name: r.name,
    summary: r.summary,
    verifiedOn: r.verified?.on ?? null,
    requiresEmployer: r.requiresEmployer,
    facts: facts(r, asOf),
  };
}

export function listRoutes(asOf: string = today()): RouteSummary[] {
  return ROUTES.map((r) => summary(r, asOf));
}

export function getRoute(routeId: string, asOf: string = today()): RouteDetail | undefined {
  const r = ROUTES.find((x) => x.id === routeId);
  if (!r) return undefined;
  return {
    ...summary(r, asOf),
    officialUrl: r.officialUrl,
    requirements: r.requirements.map((q) => ({
      id: q.id,
      text: q.text,
      who: q.who,
      sources: q.sources,
      ...(q.effective ? { effective: definedOnly(q.effective) } : {}),
    })),
  };
}

export function listNationalities(): { code: string; name: string }[] {
  return countries.map((c) => ({ ...c }));
}

export const ProfileSchema = z.object({
  nationalities: z
    .array(z.string().regex(/^[A-Z]{2}$/))
    .min(1)
    .max(2)
    .refine((codes) => codes.every((c) => KNOWN_CODES.has(c)), "unknown nationality code"),
  age: z.number().int().min(14).max(100),
  degree: z.enum(["none", "diploma", "bachelor", "master", "doctorate"]),
  university: z.string().max(200).optional(),
  graduationYear: z.number().int().min(1950).max(2100).optional(),
  field: z.string().max(100).optional(),
  yearsExperience: z.number().min(0).max(60),
  languages: z
    .array(
      z.object({
        code: z.string().min(2).max(3),
        level: z.enum(["basic", "conversational", "business", "native"]),
      }),
    )
    .max(10),
  expectedSalary: z
    .object({ SG: z.number().nonnegative().optional(), JP: z.number().nonnegative().optional() })
    .optional(),
  hasOffer: z.boolean().optional(),
  universityCountry: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .refine((c) => KNOWN_CODES.has(c), "unknown country code")
    .optional(),
});

function toBase64Url(text: string): string {
  let binary = "";
  new TextEncoder().encode(text).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeProfile(profile: Profile): string {
  return toBase64Url(JSON.stringify(profile));
}

/** The URL is untrusted input: anything that doesn't parse as a valid profile returns null. */
export function decodeProfile(encoded: string): Profile | null {
  try {
    const parsed = ProfileSchema.safeParse(JSON.parse(fromBase64Url(encoded)));
    if (!parsed.success) return null;
    const { expectedSalary, ...rest } = parsed.data;
    return {
      ...definedOnly(rest),
      ...(expectedSalary ? { expectedSalary: definedOnly(expectedSalary) } : {}),
    };
  } catch {
    return null;
  }
}
