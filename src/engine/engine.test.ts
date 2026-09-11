import { describe, expect, it } from "vitest";
import { floorForAge } from "./evaluate";
import { decodeProfile, encodeProfile, evaluate, getRoute, listNationalities, listRoutes } from "./index";
import type { Profile, RouteResult } from "./types";

const base: Profile = {
  nationalities: ["ID"],
  age: 22,
  degree: "bachelor",
  yearsExperience: 0.7,
  languages: [{ code: "en", level: "business" }],
};

function ep(profile: Profile, asOf: string): RouteResult {
  const sg = evaluate(profile, asOf).find((d) => d.destination === "SG")!;
  return sg.routes.find((r) => r.routeId === "sg-employment-pass")!;
}

function item(route: RouteResult, id: string) {
  return route.checklist.find((c) => c.requirementId === id);
}

describe("floorForAge", () => {
  const table = [
    { age: 23, amount: 5600 },
    { age: 24, amount: 5832 },
    { age: 45, amount: 10700 },
  ];
  it("uses the first row for younger ages and the last row for older ones", () => {
    expect(floorForAge(table, 19)).toBe(5600);
    expect(floorForAge(table, 23)).toBe(5600);
    expect(floorForAge(table, 24)).toBe(5832);
    expect(floorForAge(table, 60)).toBe(10700);
  });
});

describe("SG Employment Pass", () => {
  it("Indonesian, 22, S$5,600 offer, meets the floor before 2027", () => {
    const r = ep({ ...base, expectedSalary: { SG: 5600 } }, "2026-10-15");
    expect(r.status).toBe("depends");
    expect(item(r, "salary-floor-2026")?.outcome).toBe("met");
    expect(r.upcomingChanges.map((c) => c.on)).toContain("2027-01-01");
  });

  it("the same offer is below the floor for new applications from 2027", () => {
    const r = ep({ ...base, expectedSalary: { SG: 5600 } }, "2027-01-05");
    expect(r.status).toBe("closed");
    expect(r.reason).toContain("S$6,000");
    expect(item(r, "salary-floor-2026")).toBeUndefined();
  });

  it("switches tables exactly on 1 Jan 2027", () => {
    const p = { ...base, expectedSalary: { SG: 5800 } };
    expect(ep(p, "2026-12-31").status).toBe("depends");
    expect(ep(p, "2027-01-01").status).toBe("closed");
  });

  it("Indian, 24, S$6,000: the age table applies, not the headline figure", () => {
    const p: Profile = { ...base, nationalities: ["IN"], age: 24, degree: "master", expectedSalary: { SG: 6000 } };
    expect(ep(p, "2026-10-15").status).toBe("depends"); // floor 5,832 at 24
    expect(ep(p, "2027-02-01").status).toBe("closed"); // floor 6,250 at 24
  });

  it("Filipino, 30, S$7,000 is below the S$7,223 floor at 30", () => {
    const r = ep({ ...base, nationalities: ["PH"], age: 30, expectedSalary: { SG: 7000 } }, "2026-10-15");
    expect(r.status).toBe("closed");
    expect(r.reason).toContain("S$7,223");
  });

  it("Vietnamese, 23, no salary given: the floor is shown as unknown with the figure", () => {
    const r = ep({ ...base, nationalities: ["VN"], age: 23 }, "2026-10-15");
    expect(r.status).toBe("depends");
    expect(item(r, "salary-floor-2026")?.outcome).toBe("unknown");
    expect(item(r, "salary-floor-2026")?.note).toContain("S$5,600");
  });

  it("the financial-services floor never closes the route on its own", () => {
    const r = ep({ ...base, expectedSalary: { SG: 5700 } }, "2026-10-15");
    expect(item(r, "salary-floor-financial-2026")?.outcome).toBe("unmet");
    expect(r.status).toBe("depends");
  });

  it("gives the same result for every nationality, since the EP rules don't depend on it", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = ep({ ...base, nationalities: [n], expectedSalary: { SG: 5600 } }, "2026-10-15");
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });

  it("stays unverified until the review page stamps it", () => {
    expect(ep(base, "2026-10-15").verifiedOn).toBeNull();
    expect(getRoute("sg-employment-pass")?.requirements.every((q) => q.sources.length > 0)).toBe(true);
  });
});

describe("profile encoding", () => {
  it("round-trips a profile", () => {
    const p: Profile = { ...base, nationalities: ["ID", "AU"], expectedSalary: { SG: 5600, JP: 4_000_000 } };
    expect(decodeProfile(encodeProfile(p))).toEqual(p);
  });

  it("rejects anything that isn't a valid profile", () => {
    expect(decodeProfile("not-base64!")).toBeNull();
    expect(decodeProfile(encodeProfile({ ...base, nationalities: ["XX"] }))).toBeNull();
    expect(decodeProfile(encodeProfile({ ...base, nationalities: ["ID", "IN", "VN"] }))).toBeNull();
    expect(decodeProfile(encodeProfile({ ...base, age: 5 }))).toBeNull();
  });
});

describe("catalogue", () => {
  it("lists every ISO nationality and the SG Employment Pass", () => {
    const codes = listNationalities().map((n) => n.code);
    expect(codes.length).toBeGreaterThanOrEqual(240);
    expect(codes).toEqual(expect.arrayContaining(["ID", "IN", "VN", "PH", "NG"]));
    expect(listRoutes().map((r) => r.routeId)).toContain("sg-employment-pass");
  });
});
