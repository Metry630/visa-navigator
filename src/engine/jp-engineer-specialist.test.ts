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

function gijinkoku(profile: Profile, asOf = "2026-10-15"): RouteResult {
  const jp = evaluate(profile, asOf).find((d) => d.destination === "JP")!;
  return jp.routes.find((r) => r.routeId === "jp-engineer-specialist")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("JP Engineer / Specialist in Humanities / International Services", () => {
  it("needs an employer, so it never opens on the profile alone", () => {
    const r = gijinkoku(base);
    expect(r.status).toBe("depends");
    expect(r.reason).toContain("employer");
    expect(r.checklist.some((c) => c.who === "employer")).toBe(true);
  });

  it("never claims the degree rule is met, because it turns on the subject", () => {
    // This was a `degree` rule checking the level alone, so any bachelor's read as "Met". Its source
    // says "having majored in subjects related to the technology or knowledge concerned", and
    // nothing here knows what the work is, so the level was never the whole condition.
    for (const degree of ["bachelor", "master", "diploma"] as const) {
      const outcome = item(gijinkoku({ ...base, degree }), "degree-in-related-subject")?.outcome;
      expect(outcome).toBe("unknown");
    }
  });

  // The criteria are a choice of four: a related degree, a Japanese vocational course, ten years of
  // experience, or a listed information-processing qualification. The engine has no "any one of
  // these" rule kind, so the degree is carried as a non-blocking check and the other three as notes.
  // Missing the degree must therefore leave the route at "depends", never at "closed".
  it("does not close for someone without a degree, because three other ways in exist", () => {
    for (const degree of ["none", "diploma"] as const) {
      const r = gijinkoku({ ...base, degree, yearsExperience: 12 });
      expect(r.status).toBe("depends");
      expect(item(r, "alternatives-to-a-degree")?.outcome).toBe("unknown");
      expect(item(r, "it-qualification-instead")?.outcome).toBe("unknown");
    }
  });

  it("leaves the pay comparison to the employer rather than to a salary table", () => {
    const r = gijinkoku({ ...base, expectedSalary: { JP: 3_000_000 } });
    const pay = item(r, "pay-comparable-to-a-japanese-national");
    expect(pay?.who).toBe("employer");
    expect(pay?.outcome).toBe("unknown");
    expect(r.checklist.some((c) => c.text.includes("¥"))).toBe(false);
  });

  it("applies the CEFR B2 language rule only to applications from 15 April 2026", () => {
    expect(item(gijinkoku(base, "2026-04-14"), "language-b2-customer-facing")).toBeUndefined();
    expect(item(gijinkoku(base, "2026-04-15"), "language-b2-customer-facing")?.outcome).toBe(
      "unknown",
    );
    expect(item(gijinkoku(base, "2026-04-15"), "language-b2-already-met")?.who).toBe("you");
  });

  it("announces the language rule as an upcoming change while it is still ahead", () => {
    expect(gijinkoku(base, "2026-01-05").upcomingChanges.map((c) => c.on)).toContain("2026-04-15");
    expect(gijinkoku(base, "2026-10-15").upcomingChanges).toEqual([]);
  });

  it("gives the same answer for every nationality, since the criteria don't depend on one", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = gijinkoku({ ...base, nationalities: [n] });
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });

  it("carries a source on every requirement, and reports only the stamp the data carries", () => {
    const detail = getRoute("jp-engineer-specialist")!;
    expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    // Not "is null": that encodes today's review progress rather than the contract, and it
    // has already broken twice as routes were stamped. verifiedOn mirrors the route file.
    expect(detail.verifiedOn === null || /^\d{4}-\d{2}-\d{2}$/.test(detail.verifiedOn)).toBe(true);
  });

  // Everything on this route is quoted from Japanese pages, so the reviewer reads Japanese next to
  // English. The two dated requirements are the only ones with an effective window.
  it("dates only the two language requirements", () => {
    const dated = getRoute("jp-engineer-specialist")!.requirements.filter((q) => q.effective);
    expect(dated.map((q) => q.id)).toEqual([
      "language-b2-customer-facing",
      "language-b2-already-met",
    ]);
    expect(dated.every((q) => q.effective?.from === "2026-04-15")).toBe(true);
  });
});
