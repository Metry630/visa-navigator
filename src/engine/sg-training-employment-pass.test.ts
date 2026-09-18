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

function tep(profile: Profile, asOf = "2026-10-15"): RouteResult {
  const sg = evaluate(profile, asOf).find((d) => d.destination === "SG")!;
  return sg.routes.find((r) => r.routeId === "sg-training-employment-pass")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("SG Training Employment Pass", () => {
  it("every checklist outcome is unknown, because every requirement is manual", () => {
    const r = tep(base);
    expect(r.checklist).toHaveLength(5);
    expect(r.checklist.every((c) => c.outcome === "unknown")).toBe(true);
    expect(item(r, "student-or-trainee")?.outcome).toBe("unknown");
    expect(item(r, "salary-or-institution")?.outcome).toBe("unknown");
    expect(item(r, "duration-3-months")?.outcome).toBe("unknown");
  });

  it("status is depends and never open across varied profiles", () => {
    const profiles: Profile[] = [
      base,
      { ...base, age: 30 },
      { ...base, degree: "master" },
      { ...base, yearsExperience: 5 },
      { ...base, expectedSalary: { SG: 8000 } },
    ];
    for (const profile of profiles) {
      const r = tep(profile);
      expect(r.status).toBe("depends");
    }
  });

  it("needs an employer, so the employer owns at least one item", () => {
    const r = tep(base);
    expect(item(r, "salary-or-institution")?.who).toBe("employer");
    const whos = new Set(r.checklist.map((c) => c.who));
    expect(whos.has("you")).toBe(true);
    expect(whos.has("employer")).toBe(true);
    expect(whos.has("authority")).toBe(true);
  });

  it("gives the same answer for every nationality, since Training Employment Pass turns on the sponsorship", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = tep({ ...base, nationalities: [n] });
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });

  it("has no dated rules, so nothing is announced as an upcoming change", () => {
    expect(tep(base).upcomingChanges).toEqual([]);
    expect(getRoute("sg-training-employment-pass")!.requirements.some((q) => q.effective)).toBe(
      false,
    );
  });

  it("carries a source on every requirement and is verified by a person", () => {
    const detail = getRoute("sg-training-employment-pass")!;
    expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    const result = tep(base);
    expect(result.verifiedOn).toBe(detail.verifiedOn);
    if (result.verifiedOn !== null) {
      expect(result.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
