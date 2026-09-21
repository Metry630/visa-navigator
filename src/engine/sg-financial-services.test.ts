import { describe, expect, it } from "vitest";
import { evaluate } from "./index";
import type { Profile, RouteResult } from "./types";

// Singapore writes two salary floors for the Employment Pass and the S Pass, one for financial
// services and one for everything else, and the engine used to evaluate both against everybody.
// That was wrong in both directions: an ordinary job was shown a red mark on a rule whose own text
// begins "If the employer is in financial services", and a financial services job was shown a green
// one on the blocking floor that excludes it. This file is the guard on both.

const asOf = "2026-10-15";

const base: Profile = {
  nationalities: ["ID"],
  age: 23,
  degree: "bachelor",
  yearsExperience: 0,
  languages: [{ code: "en", level: "business" }],
};

function route(profile: Profile, routeId: string): RouteResult {
  const sg = evaluate(profile, asOf).find((d) => d.destination === "SG")!;
  return sg.routes.find((r) => r.routeId === routeId)!;
}

function item(r: RouteResult, id: string) {
  return r.checklist.find((c) => c.requirementId === id);
}

describe("salary floors are read per sector", () => {
  it("asks which sector the job is in before deciding either floor", () => {
    const r = route({ ...base, expectedSalary: { SG: 6000 } }, "sg-employment-pass");
    expect(item(r, "salary-floor-2026")?.outcome).toBe("unknown");
    expect(item(r, "salary-floor-2026")?.missing).toBe("financialServices");
    expect(item(r, "salary-floor-financial-2026")?.outcome).toBe("unknown");
    expect(item(r, "salary-floor-financial-2026")?.missing).toBe("financialServices");
  });

  it("outside financial services, only the general floor applies", () => {
    const r = route(
      { ...base, financialServices: false, expectedSalary: { SG: 6000 } },
      "sg-employment-pass",
    );
    expect(item(r, "salary-floor-2026")?.outcome).toBe("met");
    expect(item(r, "salary-floor-financial-2026")).toBeUndefined();
  });

  it("inside financial services, only the higher floor applies", () => {
    const r = route(
      { ...base, financialServices: true, expectedSalary: { SG: 6000 } },
      "sg-employment-pass",
    );
    expect(item(r, "salary-floor-financial-2026")?.outcome).toBe("unmet");
    expect(item(r, "salary-floor-2026")).toBeUndefined();
  });

  it("never reports the general floor as met for a financial services job", () => {
    // The regression this file exists for. The general floor is the blocking one and its own
    // text excludes financial services, so reporting it met for a financial services job was a
    // green mark on the rule that decides the outcome.
    for (const salary of [6000, 5700, 10000]) {
      const r = route(
        {
          ...base,
          financialServices: true,
          expectedSalary: { SG: salary },
        },
        "sg-employment-pass",
      );
      expect(item(r, "salary-floor-2026")).toBeUndefined();
    }
  });

  it("closes the route when a financial services job is under its own floor", () => {
    // Until 2026-09-21 the two financial floors were blocking: false, which was a hedge from when
    // the engine could not tell the sectors apart: a rule it might be applying to the wrong person
    // should not close anything. Now that it only applies them to the right person, the honest
    // setting is the same as the general floor's, so being under the floor closes the route rather
    // than leaving it to look like it merely depends on the employer.
    const under = route(
      { ...base, financialServices: true, expectedSalary: { SG: 6000 } },
      "sg-employment-pass",
    );
    expect(under.status).toBe("closed");
    expect(under.reason).toContain("S$6,200");

    const over = route(
      { ...base, financialServices: true, expectedSalary: { SG: 6500 } },
      "sg-employment-pass",
    );
    expect(over.status).not.toBe("closed");
  });

  it("applies the same split to the S Pass", () => {
    const ordinary = route(
      { ...base, financialServices: false, expectedSalary: { SG: 3500 } },
      "sg-s-pass",
    );
    expect(item(ordinary, "salary-floor-2026")?.outcome).toBe("met");
    expect(item(ordinary, "salary-floor-financial-2026")).toBeUndefined();
    const finance = route(
      { ...base, financialServices: true, expectedSalary: { SG: 3500 } },
      "sg-s-pass",
    );
    expect(item(finance, "salary-floor-financial-2026")?.outcome).toBe("unmet");
    expect(item(finance, "salary-floor-2026")).toBeUndefined();
  });

  it("leaves routes with no sector-specific floor alone", () => {
    // Japan writes no sector floors, so answering the question changes nothing there.
    function jpRoute(profile: Profile): RouteResult {
      const jp = evaluate(profile, asOf).find((d) => d.destination === "JP")!;
      return jp.routes.find((r) => r.routeId === "jp-engineer-specialist")!;
    }

    const outcomes = [
      base,
      { ...base, financialServices: false },
      { ...base, financialServices: true },
    ].map((profile) => JSON.stringify(jpRoute(profile).checklist.map((c) => c.outcome)));
    expect(new Set(outcomes).size).toBe(1);
  });
});
