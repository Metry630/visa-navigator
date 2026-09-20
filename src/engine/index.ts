// The engine's public API. The UI imports only from here, as "@/engine".
import { z } from "zod";
import { evaluateRoute } from "./evaluate";
import { insightsFor } from "./insights";
import { RouteSchema, type Route } from "./schema";
import type { Destination, DestinationResult, Profile, RouteDetail, RouteSummary } from "./types";

export type * from "./types";

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

function summary(r: Route): RouteSummary {
  return {
    routeId: r.id,
    destination: r.destination,
    name: r.name,
    summary: r.summary,
    verifiedOn: r.verified?.on ?? null,
  };
}

export function listRoutes(): RouteSummary[] {
  return ROUTES.map(summary);
}

export function getRoute(routeId: string): RouteDetail | undefined {
  const r = ROUTES.find((x) => x.id === routeId);
  if (!r) return undefined;
  return {
    ...summary(r),
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
