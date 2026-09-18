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

function entrepass(profile: Profile, asOf = "2026-10-15"): RouteResult {
  const sg = evaluate(profile, asOf).find((d) => d.destination === "SG")!;
  return sg.routes.find((r) => r.routeId === "sg-entrepass")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("SG EntrePass", () => {
  it("every checklist outcome is unknown, because every requirement is manual", () => {
    const r = entrepass(base);
    expect(r.checklist).toHaveLength(6);
    expect(r.checklist.every((c) => c.outcome === "unknown")).toBe(true);
    // Named so that dropping a requirement from the data fails here rather than going unnoticed.
    // The two blocking ones are what keep the route off "open".
    expect(item(r, "company-registered")?.outcome).toBe("unknown");
    expect(item(r, "qualifying-criterion")?.outcome).toBe("unknown");
    expect(item(r, "excluded-businesses")?.who).toBe("authority");
  });

  it("status is depends and never open across varied profiles", () => {
    // open would tell a user they qualify today, and nothing here has been checked
    const profiles: Profile[] = [
      base,
      { ...base, age: 30 },
      { ...base, degree: "master" },
      { ...base, yearsExperience: 5 },
      { ...base, expectedSalary: { SG: 8000 } },
    ];
    for (const profile of profiles) {
      const r = entrepass(profile);
      expect(r.status).toBe("depends");
    }
  });

  it("needs no employer, so nothing on the checklist is the employer's job", () => {
    const r = entrepass(base);
    expect(r.checklist.some((c) => c.who === "employer")).toBe(false);
  });

  it("gives the same answer for every nationality, since EntrePass turns on the company", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = entrepass({ ...base, nationalities: [n] });
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });

  it("has no dated rules, so nothing is announced as an upcoming change", () => {
    expect(entrepass(base).upcomingChanges).toEqual([]);
    expect(getRoute("sg-entrepass")!.requirements.some((q) => q.effective)).toBe(false);
  });

  it("carries a source on every requirement and is verified by a person", () => {
    const detail = getRoute("sg-entrepass")!;
    expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    const result = entrepass(base);
    expect(result.verifiedOn).toBe(detail.verifiedOn);
    if (result.verifiedOn !== null) {
      expect(result.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
