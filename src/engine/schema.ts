// Schema for the route files in src/data. Every rule carries its own sources; nothing is trusted
// without a verbatim quote from an official page.
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const SourceSchema = z.object({
  url: z.string().url(),
  publisher: z.string().min(1),
  retrievedOn: isoDate,
  /** Verbatim from the rendered page. Checked against the live page by scripts/check-data.ts. */
  quote: z.string().min(10),
  /**
   * How the weekly drift check treats this source. "auto" (the default) re-fetches the page and
   * looks for the quote. "manual" is for pages the fetcher can't read as text, a PDF or a page
   * rendered by JavaScript; the check skips them and reports how many it skipped, and a person
   * re-reads them when the route is next verified.
   */
  check: z.enum(["auto", "manual"]).optional(),
});

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** One plain-English sentence shown to users. Every number in it must appear in a quote. */
  text: z.string().min(1),
  who: z.enum(["you", "employer", "authority"]),
  /** Failing a blocking requirement closes the route. */
  blocking: z.boolean(),
  sources: z.array(SourceSchema).min(1),
  effective: z.object({ from: isoDate.optional(), to: isoDate.optional() }).optional(),
};

const degreeLevel = z.enum(["none", "diploma", "bachelor", "master", "doctorate"]);
const languageLevel = z.enum(["basic", "conversational", "business", "native"]);

export const RequirementSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("salary-floor"),
    currency: z.enum(["SGD", "JPY"]),
    period: z.enum(["month", "year"]),
    sector: z.string().min(1),
    /** Rows sorted by age. The first row also covers younger ages, the last row also covers older ones. */
    byAge: z.array(z.object({ age: z.number().int(), amount: z.number().positive() })).min(1),
  }),
  z.object({ ...base, kind: z.literal("age"), min: z.number().int().optional(), max: z.number().int().optional() }),
  z.object({ ...base, kind: z.literal("degree"), minLevel: degreeLevel }),
  z.object({
    ...base,
    kind: z.literal("nationality-list"),
    mode: z.enum(["allow", "deny"]),
    listName: z.string().min(1),
    codes: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
  }),
  z.object({ ...base, kind: z.literal("experience"), minYears: z.number().optional(), maxYears: z.number().optional() }),
  z.object({ ...base, kind: z.literal("language"), code: z.string().min(2), minLevel: languageLevel }),
  /** Can't be decided from the profile; `who` says who has to check it. */
  z.object({ ...base, kind: z.literal("manual") }),
]);

export const RouteSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^(sg|jp)-[a-z0-9-]+$/),
  destination: z.enum(["SG", "JP"]),
  name: z.string().min(1),
  summary: z.string().min(1),
  officialUrl: z.string().url(),
  /** True for routes that need a job offer from an employer who applies. */
  requiresEmployer: z.boolean(),
  requirements: z.array(RequirementSchema).min(1),
  /** Written only by the review page when a person approves the route. */
  verified: z.object({ by: z.string().min(1), on: isoDate }).nullable(),
});

export type Requirement = z.infer<typeof RequirementSchema>;
export type Route = z.infer<typeof RouteSchema>;
