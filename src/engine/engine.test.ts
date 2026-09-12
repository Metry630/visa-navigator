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

function route(profile: Profile, asOf: string, routeId: string): RouteResult {
  const sg = evaluate(profile, asOf).find((d) => d.destination === "SG")!;
  return sg.routes.find((r) => r.routeId === routeId)!;
}

function ep(profile: Profile, asOf: string): RouteResult {
  return route(profile, asOf, "sg-employment-pass");
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

describe("SG S Pass", () => {
  const sp = (p: Profile, asOf: string) => route(p, asOf, "sg-s-pass");

  it("Indonesian, 22, S$3,300 offer, meets the floor before 2027", () => {
    const r = sp({ ...base, expectedSalary: { SG: 3300 } }, "2026-10-15");
    expect(r.status).toBe("depends");
    expect(item(r, "salary-floor-2026")?.outcome).toBe("met");
    expect(r.upcomingChanges.map((c) => c.on)).toContain("2027-01-01");
  });

  it("the same offer is below the floor for new applications from 2027", () => {
    const r = sp({ ...base, expectedSalary: { SG: 3300 } }, "2027-01-05");
    expect(r.status).toBe("closed");
    expect(r.reason).toContain("S$3,600");
    expect(item(r, "salary-floor-2026")).toBeUndefined();
  });

  it("Indian, 30, S$3,700 is below the S$3,777 floor at 30", () => {
    const r = sp({ ...base, nationalities: ["IN"], age: 30, expectedSalary: { SG: 3700 } }, "2026-10-15");
    expect(r.status).toBe("closed");
    expect(r.reason).toContain("S$3,777");
  });

  it("Filipino, 26, S$4,000 clears both the 2026 and the 2027 floor at 26", () => {
    const p: Profile = { ...base, nationalities: ["PH"], age: 26, expectedSalary: { SG: 4000 } };
    expect(sp(p, "2026-10-15").status).toBe("depends"); // floor 3,505 at 26
    expect(sp(p, "2027-02-01").status).toBe("depends"); // floor 3,805 at 26
  });

  it("the financial-services floor never closes the route on its own", () => {
    const r = sp({ ...base, nationalities: ["VN"], expectedSalary: { SG: 3400 } }, "2026-10-15");
    expect(item(r, "salary-floor-financial-2026")?.outcome).toBe("unmet");
    expect(r.status).toBe("depends");
  });

  it("gives the same result for every nationality, since the S Pass rules don't depend on it", () => {
    const outcomes = ["ID", "IN", "VN", "PH", "NG"].map((n) => {
      const r = sp({ ...base, nationalities: [n], expectedSalary: { SG: 3300 } }, "2026-10-15");
      return JSON.stringify([r.status, r.checklist.map((c) => c.outcome)]);
    });
    expect(new Set(outcomes).size).toBe(1);
  });
});

describe("SG Work Holiday Pass (Work Holiday Programme)", () => {
  const whp = (p: Profile) => route(p, "2026-10-15", "sg-work-holiday-pass");

  it("is open to any nationality at 22, and the university check stays for the applicant", () => {
    for (const n of ["ID", "IN", "NG"]) {
      const r = whp({ ...base, nationalities: [n] });
      expect(r.status).toBe("depends");
      expect(item(r, "age-18-25")?.outcome).toBe("met");
      expect(item(r, "university-country")?.outcome).toBe("unknown");
      expect(item(r, "university-country")?.who).toBe("you");
    }
  });

  it("closes at 26, one year over the limit", () => {
    expect(whp({ ...base, age: 25 }).status).toBe("depends");
    expect(whp({ ...base, age: 26 }).status).toBe("closed");
    expect(whp({ ...base, age: 17 }).status).toBe("closed");
  });

  it("needs no employer, so no requirement asks the employer anything", () => {
    expect(whp(base).checklist.some((c) => c.who === "employer")).toBe(false);
  });
});

describe("SG Work Holiday Pass (Work and Holiday Visa Programmes)", () => {
  const whvp = (p: Profile) => route(p, "2026-10-15", "sg-work-and-holiday-pass");

  it("is closed to anyone who is neither Australian nor New Zealander", () => {
    for (const n of ["ID", "IN", "PH"]) {
      const r = whvp({ ...base, nationalities: [n] });
      expect(r.status).toBe("closed");
      expect(item(r, "citizenship-au-nz")?.outcome).toBe("unmet");
    }
  });

  it("opens for Australians and New Zealanders in the age range", () => {
    for (const n of ["AU", "NZ"]) {
      expect(whvp({ ...base, nationalities: [n], age: 30 }).status).toBe("depends");
      expect(whvp({ ...base, nationalities: [n], age: 31 }).status).toBe("closed");
    }
  });

  it("counts a dual national who holds one of the two citizenships", () => {
    expect(whvp({ ...base, nationalities: ["ID", "AU"] }).status).toBe("depends");
  });
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("SG catalogue", () => {
  it("lists every Singapore route", () => {
    const sg = listRoutes().filter((r) => r.destination === "SG");
    expect(sg.map((r) => r.routeId)).toEqual([
      "sg-employment-pass",
      "sg-entrepass",
      "sg-s-pass",
      "sg-training-employment-pass",
      "sg-work-and-holiday-pass",
      "sg-work-holiday-pass",
    ]);
    // verifiedOn moves from null to a stamped date as the review page approves each route; either
    // is a valid state, but never anything else.
    expect(sg.every((r) => r.verifiedOn === null || ISO_DATE.test(r.verifiedOn))).toBe(true);
  });

  it("gives every requirement of every SG route at least one source", () => {
    for (const r of listRoutes().filter((x) => x.destination === "SG")) {
      const detail = getRoute(r.routeId)!;
      expect(detail.requirements.length).toBeGreaterThan(0);
      expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    }
  });
});

function jpRoute(profile: Profile, routeId: string): RouteResult {
  const jp = evaluate(profile, "2026-10-15").find((d) => d.destination === "JP")!;
  return jp.routes.find((r) => r.routeId === routeId)!;
}

describe("JP Working Holiday", () => {
  const wh = (p: Profile) => jpRoute(p, "jp-working-holiday");

  it("is closed to nationalities with no working holiday arrangement", () => {
    for (const n of ["ID", "IN", "PH", "VN"]) {
      const r = wh({ ...base, nationalities: [n] });
      expect(r.status).toBe("closed");
      expect(item(r, "partner-country")?.outcome).toBe("unmet");
    }
  });

  it("opens as far as it can for a partner nationality, leaving the embassy checks to the applicant", () => {
    for (const n of ["TW", "DE", "GB", "KR"]) {
      const r = wh({ ...base, nationalities: [n], age: 24 });
      expect(r.status).toBe("depends");
      expect(item(r, "partner-country")?.outcome).toBe("met");
      expect(item(r, "age-18-30")?.outcome).toBe("met");
      expect(item(r, "funds-for-initial-stay")?.outcome).toBe("unknown");
      expect(item(r, "funds-for-initial-stay")?.who).toBe("you");
    }
  });

  it("closes at 31 and below 18", () => {
    expect(wh({ ...base, nationalities: ["DE"], age: 30 }).status).toBe("depends");
    expect(wh({ ...base, nationalities: ["DE"], age: 31 }).status).toBe("closed");
    expect(wh({ ...base, nationalities: ["DE"], age: 17 }).status).toBe("closed");
  });

  // The 18 to 25 limit for Australia, Canada, South Korea and Ireland can't be applied from the
  // profile yet: the engine has no per-nationality age limit. It is carried as a note the applicant
  // reads, so a 27 year old Australian still sees "depends" rather than a wrong "closed".
  it("shows the lower age limit for four countries as a note rather than enforcing it", () => {
    const r = wh({ ...base, nationalities: ["AU"], age: 27 });
    expect(r.status).toBe("depends");
    expect(item(r, "age-limit-four-countries")?.outcome).toBe("unknown");
    expect(item(r, "age-limit-four-countries")?.text).toContain("18 to 25");
  });

  it("counts a dual national who holds one partner nationality", () => {
    expect(wh({ ...base, nationalities: ["ID", "DE"] }).status).toBe("depends");
  });

  it("needs no employer, so nothing on the checklist is the employer's job", () => {
    expect(wh({ ...base, nationalities: ["DE"] }).checklist.some((c) => c.who === "employer")).toBe(
      false,
    );
  });
});

describe("JP catalogue", () => {
  it("lists the Japanese routes", () => {
    const jp = listRoutes().filter((r) => r.destination === "JP");
    expect(jp.map((r) => r.routeId)).toEqual(["jp-working-holiday"]);
    expect(jp.every((r) => r.verifiedOn === null || ISO_DATE.test(r.verifiedOn))).toBe(true);
  });

  it("gives every requirement of every JP route at least one source", () => {
    for (const r of listRoutes().filter((x) => x.destination === "JP")) {
      const detail = getRoute(r.routeId)!;
      expect(detail.requirements.length).toBeGreaterThan(0);
      expect(detail.requirements.every((q) => q.sources.length > 0)).toBe(true);
    }
  });
});
