// STUB: replaced by the real engine. Do not build features on the fixture data.

import type {
  Destination,
  DestinationResult,
  Profile,
  RouteDetail,
  RouteResult,
  RouteSummary,
  Source,
} from "./types";

export type * from "./types";

export const DESTINATIONS: { code: Destination; name: string }[] = [
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
];

const exampleSource = (url: string, publisher: string): Source => ({
  url,
  publisher,
  retrievedOn: "2026-01-15",
  quote: "Example only. This quote is fixture text and is not from an official page.",
});

const FIXTURE_ROUTES: RouteDetail[] = [
  {
    routeId: "sg-example-pass",
    destination: "SG",
    name: "Example only: Singapore work pass",
    summary: "Example only. A fixture route used while the real engine is being built.",
    verifiedOn: "2026-01-15",
    officialUrl: "https://www.mom.gov.sg/",
    requirements: [
      {
        id: "sg-example-degree",
        text: "Example only: you hold a recognised degree.",
        who: "you",
        sources: [exampleSource("https://www.mom.gov.sg/", "Ministry of Manpower")],
      },
      {
        id: "sg-example-salary",
        text: "Example only: the employer offers at least the monthly salary floor.",
        who: "employer",
        sources: [exampleSource("https://www.mom.gov.sg/", "Ministry of Manpower")],
        effective: { from: "2026-01-01" },
      },
      {
        id: "sg-example-approval",
        text: "Example only: the authority approves the application.",
        who: "authority",
        sources: [exampleSource("https://www.mom.gov.sg/", "Ministry of Manpower")],
      },
    ],
  },
  {
    routeId: "jp-example-pass",
    destination: "JP",
    name: "Example only: Japan work status",
    summary: "Example only. A fixture route used while the real engine is being built.",
    verifiedOn: null,
    officialUrl: "https://www.moj.go.jp/isa/",
    requirements: [
      {
        id: "jp-example-degree",
        text: "Example only: your degree matches the job you are offered.",
        who: "you",
        sources: [exampleSource("https://www.moj.go.jp/isa/", "Immigration Services Agency")],
      },
      {
        id: "jp-example-sponsor",
        text: "Example only: the employer files a certificate of eligibility for you.",
        who: "employer",
        sources: [exampleSource("https://www.moj.go.jp/isa/", "Immigration Services Agency")],
      },
    ],
  },
  {
    routeId: "jp-example-closed",
    destination: "JP",
    name: "Example only: Japan youth scheme",
    summary: "Example only. A fixture route that is closed for most fixture profiles.",
    verifiedOn: "2026-01-15",
    officialUrl: "https://www.mofa.go.jp/",
    requirements: [
      {
        id: "jp-example-nationality",
        text: "Example only: your nationality takes part in the scheme.",
        who: "you",
        sources: [exampleSource("https://www.mofa.go.jp/", "Ministry of Foreign Affairs")],
      },
      {
        id: "jp-example-age",
        text: "Example only: you are within the age range for the scheme.",
        who: "you",
        sources: [exampleSource("https://www.mofa.go.jp/", "Ministry of Foreign Affairs")],
      },
    ],
  },
];

const NATIONALITIES: { code: string; name: string }[] = [
  { code: "AU", name: "Australia" },
  { code: "BD", name: "Bangladesh" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "DE", name: "Germany" },
  { code: "EG", name: "Egypt" },
  { code: "ES", name: "Spain" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "ID", name: "Indonesia" },
  { code: "IN", name: "India" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "NG", name: "Nigeria" },
  { code: "NL", name: "Netherlands" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "PL", name: "Poland" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "TW", name: "Taiwan" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
  { code: "ZA", name: "South Africa" },
];

export function listNationalities(): { code: string; name: string }[] {
  return NATIONALITIES.map((n) => ({ ...n }));
}

export function listRoutes(): RouteSummary[] {
  return FIXTURE_ROUTES.map(({ routeId, destination, name, summary, verifiedOn }) => ({
    routeId,
    destination,
    name,
    summary,
    verifiedOn,
  }));
}

export function getRoute(routeId: string): RouteDetail | undefined {
  return FIXTURE_ROUTES.find((r) => r.routeId === routeId);
}

function fixtureResult(detail: RouteDetail, profile: Profile): RouteResult {
  const status =
    detail.routeId === "jp-example-closed"
      ? "closed"
      : detail.routeId === "jp-example-pass"
        ? "depends"
        : profile.degree === "none"
          ? "depends"
          : "open";

  const reason =
    status === "closed"
      ? "Example only: this fixture route is shown as closed."
      : status === "depends"
        ? "Example only: this fixture route depends on an employer."
        : "Example only: this fixture route is shown as open.";

  return {
    routeId: detail.routeId,
    destination: detail.destination,
    name: detail.name,
    status,
    reason,
    checklist: detail.requirements.map((req, i) => ({
      requirementId: req.id,
      text: req.text,
      who: req.who,
      outcome: status === "closed" ? "unmet" : req.who === "you" ? "met" : "unknown",
      note: i === 0 ? "Example only: this note is fixture text." : undefined,
      sources: req.sources,
    })),
    upcomingChanges:
      detail.destination === "SG"
        ? [{ on: "2027-01-01", text: "Example only: a fixture rule change happens on this date." }]
        : [],
    verifiedOn: detail.verifiedOn,
  };
}

export function evaluate(profile: Profile, _asOf?: string): DestinationResult[] {
  return DESTINATIONS.map((d) => ({
    destination: d.code,
    name: d.name,
    routes: FIXTURE_ROUTES.filter((r) => r.destination === d.code).map((r) =>
      fixtureResult(r, profile),
    ),
  }));
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeProfile(profile: Profile): string {
  return toBase64Url(JSON.stringify(profile));
}

const DEGREES: string[] = ["none", "diploma", "bachelor", "master", "doctorate"];
const LEVELS: string[] = ["basic", "conversational", "business", "native"];

export function decodeProfile(encoded: string): Profile | null {
  try {
    const raw: unknown = JSON.parse(fromBase64Url(encoded));
    if (typeof raw !== "object" || raw === null) return null;
    const p = raw as Record<string, unknown>;

    const nationalities = p.nationalities;
    if (
      !Array.isArray(nationalities) ||
      nationalities.length < 1 ||
      nationalities.length > 2 ||
      !nationalities.every((n) => typeof n === "string" && /^[A-Z]{2}$/.test(n))
    ) {
      return null;
    }
    if (typeof p.age !== "number" || !Number.isFinite(p.age) || p.age < 14 || p.age > 100) {
      return null;
    }
    if (typeof p.degree !== "string" || !DEGREES.includes(p.degree)) return null;
    if (
      typeof p.yearsExperience !== "number" ||
      !Number.isFinite(p.yearsExperience) ||
      p.yearsExperience < 0
    ) {
      return null;
    }
    if (
      !Array.isArray(p.languages) ||
      !p.languages.every(
        (l) =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as { code?: unknown }).code === "string" &&
          LEVELS.includes(String((l as { level?: unknown }).level)),
      )
    ) {
      return null;
    }

    const profile: Profile = {
      nationalities: nationalities as string[],
      age: p.age,
      degree: p.degree as Profile["degree"],
      yearsExperience: p.yearsExperience,
      languages: p.languages as Profile["languages"],
    };
    if (typeof p.university === "string" && p.university) profile.university = p.university;
    if (typeof p.graduationYear === "number") profile.graduationYear = p.graduationYear;
    if (typeof p.field === "string" && p.field) profile.field = p.field;
    if (typeof p.expectedSalary === "object" && p.expectedSalary !== null) {
      const s = p.expectedSalary as Record<string, unknown>;
      const out: Partial<Record<Destination, number>> = {};
      if (typeof s.SG === "number") out.SG = s.SG;
      if (typeof s.JP === "number") out.JP = s.JP;
      if (Object.keys(out).length) profile.expectedSalary = out;
    }
    return profile;
  } catch {
    return null;
  }
}
