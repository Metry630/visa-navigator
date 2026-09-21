import { describe, expect, it } from "vitest";
import { evaluate } from "./index";
import type { Profile, RouteResult } from "./types";

// Japan's working holiday age limit is 18 to 30 for most partner countries, and the page also says
// Australian, Canadian, South Korean and Irish applicants have a lower limit of 18 to 25 "unless the
// two governments have agreed to extend it to 30". The engine used to evaluate the 18 to 30 rule
// against everyone, so a 27 year old Australian was told "Met" on a blocking rule while the same
// page told them their limit was 25. Neither answer is knowable for those four, so the rule is now
// scoped away from them and the dated note is scoped to them.

const asOf = "2026-10-15";

const base: Profile = {
  nationalities: ["ID"],
  age: 27,
  degree: "bachelor",
  yearsExperience: 0,
  languages: [],
};

function route(profile: Profile): RouteResult {
  const jp = evaluate(profile, asOf).find((d) => d.destination === "JP")!;
  return jp.routes.find((r) => r.routeId === "jp-working-holiday")!;
}

const has = (r: RouteResult, id: string) => r.checklist.some((c) => c.requirementId === id);
const outcome = (r: RouteResult, id: string) =>
  r.checklist.find((c) => c.requirementId === id)?.outcome;

describe("the working holiday age limit is scoped by nationality", () => {
  it("applies the 18 to 30 rule to the other partner countries", () => {
    const indonesian = route({ ...base, nationalities: ["ID"] });
    expect(outcome(indonesian, "age-18-30")).toBe("met");
    expect(has(indonesian, "age-limit-four-countries")).toBe(false);
  });

  it("never tells one of the four they meet a limit that may not be theirs", () => {
    // The regression. At 27 the old engine said "Met" on a blocking rule.
    for (const code of ["AU", "CA", "KR", "IE"]) {
      const r = route({ ...base, nationalities: [code] });
      expect(has(r, "age-18-30")).toBe(false);
      expect(has(r, "age-limit-four-countries")).toBe(true);
      expect(outcome(r, "age-limit-four-countries")).toBe("unknown");
    }
  });

  it("treats a dual national as one of the four", () => {
    // We cannot know which passport they would apply under, so the rule that would decide for them
    // is the one that steps back.
    const dual = route({ ...base, nationalities: ["ID", "AU"] });
    expect(has(dual, "age-18-30")).toBe(false);
    expect(has(dual, "age-limit-four-countries")).toBe(true);
  });

  it("leaves a nationality outside the programme to the partner-country rule", () => {
    const american = route({ ...base, nationalities: ["US"] });
    expect(outcome(american, "partner-country")).toBe("unmet");
    expect(american.status).toBe("closed");
  });
});
