// The review page's two risky parts: rewriting a route file's `verified` stamp in place, and
// showing the numbers a reviewer is meant to compare.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RouteSchema, type Route } from "../../src/engine/schema";
import { renderPage } from "./page";
import { writeVerified } from "./store";

const route: Route = RouteSchema.parse({
  schemaVersion: 1,
  id: "sg-test-route",
  destination: "SG",
  name: "Test Route",
  summary: "A route used only by this test.",
  officialUrl: "https://www.mom.gov.sg/",
  requiresEmployer: true,
  requirements: [
    {
      id: "salary",
      kind: "salary-floor",
      text: "Your fixed monthly salary must be at least S$5,600 at 23 or below.",
      who: "you",
      blocking: true,
      currency: "SGD",
      period: "month",
      sector: "all",
      byAge: [{ age: 23, amount: 5600 }],
      sources: [
        {
          url: "https://www.mom.gov.sg/",
          publisher: "Ministry of Manpower, Singapore",
          retrievedOn: "2026-09-11",
          quote: "23 or below $5,600 $6,000",
        },
      ],
    },
  ],
  verified: null,
});

function tempRouteFile(verified: string): string {
  const file = join(mkdtempSync(join(tmpdir(), "review-")), "route.json");
  writeFileSync(
    file,
    [
      "{",
      '  "id": "sg-test-route",',
      '  "requirements": [',
      '    { "id": "a", "verifiedBy": null }',
      "  ],",
      `  "verified": ${verified}`,
      "}",
      "",
    ].join("\n"),
  );
  return file;
}

describe("writeVerified", () => {
  it("stamps a route without reformatting the rest of the file", () => {
    const file = tempRouteFile("null");
    writeVerified(file, { by: "joshua", on: "2026-09-12" });
    const text = readFileSync(file, "utf8");
    expect(text).toContain('"verified": { "by": "joshua", "on": "2026-09-12" }');
    expect(text).toContain('{ "id": "a", "verifiedBy": null }');
    expect(JSON.parse(text).verified).toEqual({ by: "joshua", on: "2026-09-12" });
  });

  it("clears a stamp back to null", () => {
    const file = tempRouteFile('{ "by": "joshua", "on": "2026-09-12" }');
    writeVerified(file, null);
    expect(JSON.parse(readFileSync(file, "utf8")).verified).toBeNull();
  });
});

describe("renderPage", () => {
  it("marks a number that is on both sides differently from one that is on only one", () => {
    const html = renderPage([route], {}, "joshua");
    expect(html).toContain('<mark class="same">5,600</mark>');
    expect(html).toContain('<mark class="only">6,000</mark>');
  });

  it("shows a translation under a quote the reviewer cannot read", () => {
    // The reviewer works in English. Without this the Japanese quote sits next to an English
    // requirement text with nothing tying the two together, and approving it means nothing.
    const ja: Route = RouteSchema.parse({
      ...route,
      id: "jp-test-route",
      destination: "JP",
      officialUrl: "https://www.moj.go.jp/",
      requirements: [
        {
          id: "points",
          kind: "manual",
          text: "Your points have to add up to 70 or more.",
          who: "authority",
          blocking: true,
          sources: [
            {
              url: "https://www.moj.go.jp/",
              publisher: "Immigration Services Agency of Japan",
              retrievedOn: "2026-09-12",
              quote: "ポイントの合計が一定点数（７０点）に達した場合",
              translation: "Where the total of the points reaches a set score (70 points)",
            },
          ],
        },
      ],
    });
    const html = renderPage([ja], {}, "joshua");
    expect(html).toContain('<blockquote class="translation" lang="en">');
    expect(html).toContain("Where the total of the points reaches a set score");
    expect(html).toContain("unofficial translation");
    // The full-width 70 in the quote and the ASCII 70 in the text are the same number, so both
    // sides must be marked as shared rather than as appearing on one side only.
    expect(html).toContain('<mark class="same">７０</mark>');
    expect(html).toContain('<mark class="same">70</mark>');
  });

  it("leaves an English quote without a translation line", () => {
    expect(renderPage([route], {}, "joshua")).not.toContain('class="translation"');
  });

  it("shows a route as unverified until a person approves every requirement", () => {
    expect(renderPage([route], {}, "joshua")).toContain("not yet verified");
    const done = renderPage(
      [route],
      { "sg-test-route": { salary: { decision: "approve", on: "2026-09-12", comments: [] } } },
      "joshua",
    );
    expect(done).toContain("1 / 1 approved");
  });
});
