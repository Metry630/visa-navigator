// The measurement that started this: an Indonesian, an Indian and a Filipino graduate used to get a
// byte-identical results page. Eight questions asked, and the engine could not tell them apart,
// because no route can ever return "open" and 82% of requirements are `manual`. These tests exist to
// hold the fix in place and to keep every insight honest about where it came from.
import { describe, expect, it } from "vitest";
import { ROUTES, evaluate, getRoute } from "./index";
import type { Insight, Profile } from "./types";

const base: Profile = {
  nationalities: ["ID"],
  age: 24,
  degree: "bachelor",
  yearsExperience: 1,
  languages: [{ code: "en", level: "business" }],
  expectedSalary: { SG: 6000, JP: 5_000_000 },
};

const ASOF = "2026-10-15";
const all = (p: Profile) => evaluate(p, ASOF).flatMap((d) => d.insights);
const byId = (p: Profile, id: string): Insight | undefined => all(p).find((i) => i.id === id);

describe("every insight can be checked", () => {
  it("cites at least one requirement that really exists, with its sources", () => {
    const insights = all(base);
    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      expect(insight.from.length).toBeGreaterThan(0);
      for (const cited of insight.from) {
        const detail = getRoute(cited.routeId);
        expect(detail, `${insight.id} cites unknown route ${cited.routeId}`).toBeDefined();
        const req = detail!.requirements.find((r) => r.id === cited.requirementId);
        expect(req, `${insight.id} cites unknown requirement ${cited.requirementId}`).toBeDefined();
        expect(cited.requirementText).toBe(req!.text);
        expect(cited.sources.length).toBeGreaterThan(0);
        for (const s of cited.sources) expect(s.quote.length).toBeGreaterThan(0);
      }
    }
  });

  it("never shows a raw ISO date, because an insight is a finished sentence", () => {
    for (const insight of all(base)) expect(insight.text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("has a stable id per insight and no duplicates", () => {
    const ids = all(base).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the salary floor insight is personal and dated", () => {
  it("gives the figure for this age and what the change costs", () => {
    const at24 = byId(base, "sg-employment-pass-salary-floor-change");
    expect(at24?.text).toContain("S$5,832");
    expect(at24?.text).toContain("S$6,250");
    expect(at24?.text).toContain("S$418");
    expect(at24?.text).toContain("1 Jan 2027");
  });

  it("gives a different figure at a different age, which is the whole point", () => {
    const at30 = byId({ ...base, age: 30 }, "sg-employment-pass-salary-floor-change");
    expect(at30?.text).toContain("S$7,223");
    expect(at30?.text).toContain("S$7,750");
    expect(at30?.text).not.toContain("S$5,832");
  });

  it("says nothing once the change is already in force", () => {
    const after = evaluate(base, "2027-06-01").flatMap((d) => d.insights);
    expect(after.find((i) => i.id === "sg-employment-pass-salary-floor-change")).toBeUndefined();
  });
});

describe("the employer-size insight", () => {
  it("names the reader's own nationality, since that is what the criterion scores", () => {
    expect(byId(base, "sg-employer-diversity")?.text).toContain("(Indonesia)");
    expect(byId({ ...base, nationalities: ["IN"] }, "sg-employer-diversity")?.text).toContain(
      "(India)",
    );
    // Dual nationality has to read correctly too, and so does a country whose name is a plural.
    expect(byId({ ...base, nationalities: ["PH", "MY"] }, "sg-employer-diversity")?.text).toContain(
      "(Philippines or Malaysia)",
    );
  });

  it("carries the Singapore contrast on the Japan side, which needs both schemes to see", () => {
    const jp = byId(base, "jp-employer-category");
    expect(jp?.text).toContain("Category 1");
    expect(jp?.text).toContain("Category 4");
    expect(jp?.text).toContain("Singapore works the other way");
    // It cites Singapore's rule, so it must be reachable from the Japan destination.
    expect(jp?.from.some((f) => f.routeId === "sg-employment-pass")).toBe(true);
  });
});

describe("an insight disappears with the data behind it", () => {
  // The rule is that removing a requirement removes the sentence resting on it, rather than leaving
  // a claim with nothing behind it. Every derivation looks its requirements up by id for this reason.
  it("cites only requirement ids that are present in the data today", () => {
    const present = new Set(ROUTES.flatMap((r) => r.requirements.map((q) => `${r.id}#${q.id}`)));
    for (const insight of all(base)) {
      for (const cited of insight.from) {
        expect(present.has(`${cited.routeId}#${cited.requirementId}`)).toBe(true);
      }
    }
  });
});

describe("the page now tells these three people different things", () => {
  // Before insights existed this produced one identical page for all three. If it ever does again,
  // the product is back to being a slower way to read a government website.
  const people: [string, Profile][] = [
    ["Indonesian, 22", { ...base, nationalities: ["ID"], age: 22 }],
    ["Indian, 24", { ...base, nationalities: ["IN"], age: 24 }],
    ["Filipino, 27", { ...base, nationalities: ["PH"], age: 27 }],
  ];

  it("produces a different set of sentences for each", () => {
    const pages = people.map(([, p]) =>
      all(p)
        .map((i) => i.text)
        .join("\n"),
    );
    expect(new Set(pages).size).toBe(people.length);
  });

  it("gives every one of them at least one insight per destination", () => {
    for (const [who, p] of people) {
      for (const destination of evaluate(p, ASOF)) {
        expect(destination.insights.length, `${who} / ${destination.name}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("routes say whether an employer has to apply", () => {
  it("splits the ten routes into what you can pursue alone and what needs an offer", () => {
    const routes = evaluate(base, ASOF).flatMap((d) => d.routes);
    const alone = routes.filter((r) => !r.requiresEmployer);
    expect(alone.length).toBeGreaterThan(0);
    expect(alone.length).toBeLessThan(routes.length);
    expect(alone.map((r) => r.routeId)).toContain("jp-jfind");
    expect(routes.find((r) => r.routeId === "sg-employment-pass")?.requiresEmployer).toBe(true);
  });
});
