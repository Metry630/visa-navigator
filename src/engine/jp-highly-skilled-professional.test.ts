import { describe, expect, it } from "vitest";
import { evaluate, getRoute } from "./index";
import type { Profile, RouteResult } from "./types";

const base: Profile = {
  nationalities: ["ID"],
  age: 22,
  degree: "bachelor",
  yearsExperience: 0.7,
  languages: [{ code: "en", level: "business" }],
};

function hsp(profile: Profile, asOf = "2026-10-15"): RouteResult {
  const jp = evaluate(profile, asOf).find((d) => d.destination === "JP")!;
  return jp.routes.find((r) => r.routeId === "jp-highly-skilled-professional")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("JP Highly Skilled Professional", () => {
  it("needs an employer and never opens on the profile alone", () => {
    const r = hsp(base);
    expect(r.status).toBe("depends");
    expect(r.checklist.some((c) => c.who === "employer")).toBe(true);
  });

  // The points test itself is not in the engine: no rule kind adds a score across requirements, and
  // the official table is a PDF that does not extract cleanly enough to copy point values out of. So
  // every requirement here is manual and the route can only ever say "depends", which is honest. It
  // must not start guessing a total from the profile.
  it("decides nothing from the profile, because the points test is not in the engine", () => {
    const profiles: Profile[] = [
      base,
      { ...base, degree: "doctorate", age: 29, yearsExperience: 8 },
      { ...base, degree: "none", age: 45, yearsExperience: 0 },
      { ...base, languages: [{ code: "ja", level: "native" }], expectedSalary: { JP: 20_000_000 } },
    ];
    for (const p of profiles) {
      const r = hsp(p);
      expect(r.status).toBe("depends");
      expect(r.checklist.every((c) => c.outcome === "unknown")).toBe(true);
    }
  });

  it("puts the 70 point total on the authority and the salary floor on the employer", () => {
    const r = hsp(base);
    expect(item(r, "seventy-points")?.who).toBe("authority");
    expect(item(r, "seventy-points")?.text).toContain("70");
    expect(item(r, "minimum-annual-salary")?.who).toBe("employer");
  });

  // 3 million yen a year is a flat floor with no age table and it is written 300万円 in Japanese, so
  // it cannot be a salary-floor rule: that kind needs byAge rows, and check:data needs both the
  // amount and the age to appear in a quote. It stays manual until a flat floor kind exists.
  it("does not compare the salary floor against the profile", () => {
    const rich = hsp({ ...base, expectedSalary: { JP: 30_000_000 } });
    const poor = hsp({ ...base, expectedSalary: { JP: 1_000_000 } });
    expect(item(rich, "minimum-annual-salary")?.outcome).toBe("unknown");
    expect(item(poor, "minimum-annual-salary")?.outcome).toBe("unknown");
    expect(poor.status).toBe("depends");
  });

  it("gives the same answer for every nationality", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) =>
      JSON.stringify(hsp({ ...base, nationalities: [n] }).checklist.map((c) => c.outcome)),
    );
    expect(new Set(outcomes).size).toBe(1);
  });

  it("carries a source on every requirement, and reports only the stamp the data carries", () => {
    const detail = getRoute("jp-highly-skilled-professional")!;
    expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    // Not "is null": that encodes today's review progress rather than the contract, and it
    // has already broken twice as routes were stamped. verifiedOn mirrors the route file.
    expect(detail.verifiedOn === null || /^\d{4}-\d{2}-\d{2}$/.test(detail.verifiedOn)).toBe(true);
  });
});
