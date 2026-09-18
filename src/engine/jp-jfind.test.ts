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

function jfind(profile: Profile, asOf = "2026-10-15"): RouteResult {
  const jp = evaluate(profile, asOf).find((d) => d.destination === "JP")!;
  return jp.routes.find((r) => r.routeId === "jp-jfind")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("JP J-Find", () => {
  it("needs no employer, so nothing on the checklist is the employer's job", () => {
    const r = jfind(base);
    expect(r.checklist.some((c) => c.who === "employer")).toBe(false);
    expect(r.reason).not.toContain("employer");
  });

  // The university ranking, the five-year window and the savings are all things the applicant
  // proves, and none of them can be read off the profile, so a graduate lands on "depends" rather
  // than on a "open" the engine has not actually checked.
  it("stays at depends for a graduate, because the ranking and savings are the applicant's to prove", () => {
    const r = jfind(base);
    expect(r.status).toBe("depends");
    expect(item(r, "top-100-university")?.outcome).toBe("unknown");
    expect(item(r, "graduated-within-5-years")?.outcome).toBe("unknown");
    expect(item(r, "savings-for-living-costs")?.outcome).toBe("unknown");
    expect(item(r, "degree-from-that-university")?.outcome).toBe("met");
  });

  it("closes without a degree at bachelor's level, which this route really does require", () => {
    for (const degree of ["none", "diploma"] as const) {
      const r = jfind({ ...base, degree });
      expect(r.status).toBe("closed");
      expect(item(r, "degree-from-that-university")?.outcome).toBe("unmet");
    }
    expect(jfind({ ...base, degree: "doctorate" }).status).toBe("depends");
  });

  it("closes below 18", () => {
    expect(jfind({ ...base, age: 17 }).status).toBe("closed");
    expect(jfind({ ...base, age: 18 }).status).toBe("depends");
    expect(jfind({ ...base, age: 40 }).status).toBe("depends");
  });

  it("gives the same answer for every nationality, since J-Find turns on the university", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = jfind({ ...base, nationalities: [n] });
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });

  it("has no dated rules, so nothing is announced as an upcoming change", () => {
    expect(jfind(base).upcomingChanges).toEqual([]);
    expect(getRoute("jp-jfind")!.requirements.some((q) => q.effective)).toBe(false);
  });

  it("carries a source on every requirement, and reports only the stamp the data carries", () => {
    const detail = getRoute("jp-jfind")!;
    expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    // Not "is null": that encodes today's review progress rather than the contract, and it
    // has already broken twice as routes were stamped. verifiedOn mirrors the route file.
    expect(detail.verifiedOn === null || /^\d{4}-\d{2}-\d{2}$/.test(detail.verifiedOn)).toBe(true);
  });
});
