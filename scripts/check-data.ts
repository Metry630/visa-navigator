// Checks every route file in src/data before it can merge:
//   1. schema: parses against RouteSchema, ids are unique, currencies match the destination
//   2. grounding: every number a user sees (rule text, route summary, salary tables) appears in a quote
//   3. translation: a quote containing CJK carries one, so the maintainer can review in English
//   4. nationality lists: every code is a real country, and how much of the list a quote actually backs
//   5. verification: reported; with --release, every route must carry a person's stamp
// The live-page drift check is stream C's job (scripts/check-sources.ts).
//
//   npm run check:data              # development: unverified routes are warnings
//   npm run check:data -- --release # before publishing: unverified routes are errors
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { RouteSchema, type Route } from "../src/engine/schema";
import { isApproved } from "./review/fingerprint";
import { loadState } from "./review/store";

const COUNTRIES: { code: string; name: string }[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "src", "data", "countries.json"), "utf8"),
);
const COUNTRY_NAME = new Map(COUNTRIES.map((c) => [c.code, c.name]));
import { numbers } from "./numbers";

const DATA = join(import.meta.dirname, "..", "src", "data");
const release = process.argv.includes("--release");
const STALE_DAYS = 90;
const errors: string[] = [];
const warnings: string[] = [];

const routes: { file: string; route: Route }[] = [];
for (const dir of readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const name of readdirSync(join(DATA, dir.name)).filter((f) => f.endsWith(".json"))) {
    const file = `${dir.name}/${name}`;
    const parsed = RouteSchema.safeParse(JSON.parse(readFileSync(join(DATA, file), "utf8")));
    if (!parsed.success) {
      errors.push(
        `${file}: schema: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
      );
    } else {
      routes.push({ file, route: parsed.data });
    }
  }
}

/**
 * True for a quote the maintainer cannot read. He verifies in English only, so a Japanese quote
 * without a literal rendering beside it makes the review a formality: there is nothing to compare
 * the requirement text against. Kana and CJK ideographs, plus the full-width forms the ISA pages
 * use for digits and Latin letters.
 */
function needsTranslation(quote: string): boolean {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(quote);
}

const seen = new Set<string>();
for (const { file, route } of routes) {
  if (seen.has(route.id)) errors.push(`${file}: duplicate route id ${route.id}`);
  seen.add(route.id);
  if (!file.startsWith(route.destination.toLowerCase() + "/"))
    errors.push(`${file}: folder doesn't match destination ${route.destination}`);

  const routeQuoted = new Set(
    route.requirements.flatMap((q) => q.sources.flatMap((s) => numbers(s.quote))),
  );
  for (const n of numbers(route.summary)) {
    if (!routeQuoted.has(n)) errors.push(`${file}: summary: ${n} is not in any quote`);
  }

  const reqIds = new Set<string>();
  for (const req of route.requirements) {
    const where = `${file}#${req.id}`;
    if (reqIds.has(req.id)) errors.push(`${where}: duplicate requirement id`);
    reqIds.add(req.id);

    for (const s of req.sources) {
      if (needsTranslation(s.quote) && !s.translation) {
        errors.push(`${where}: quote from ${s.publisher} is not in English and has no translation`);
      }
    }

    const quoted = new Set(req.sources.flatMap((s) => numbers(s.quote)));
    for (const n of numbers(req.text)) {
      if (!quoted.has(n)) errors.push(`${where}: text: ${n} is not in any of its quotes`);
    }
    if (req.kind === "nationality-list") {
      // `codes` drives whether the engine opens or closes a route, and the schema only asks for two
      // uppercase letters. "UK" instead of "GB", or a typo, would pass every other check and quietly
      // give one nationality the wrong answer.
      for (const code of req.codes) {
        if (!COUNTRY_NAME.has(code))
          errors.push(`${where}: ${code} is not a country in countries.json`);
      }
      const dupes = req.codes.filter((c, i) => req.codes.indexOf(c) !== i);
      if (dupes.length) errors.push(`${where}: duplicate codes ${[...new Set(dupes)].join(", ")}`);

      // How much of the list does the evidence actually name? A long list is often a table on the
      // page, which cannot be quoted as one run, so this is a warning and not a failure. It is how
      // jp-working-holiday#partner-country was found: 32 codes and not one country named in a quote.
      const quoted = req.sources.map((s) => `${s.quote} ${s.translation ?? ""}`).join(" ");
      const named = req.codes.filter((c) =>
        quoted.includes(COUNTRY_NAME.get(c) ?? "\u0000"),
      ).length;
      if (named < req.codes.length) {
        warnings.push(
          `${where}: ${named} of ${req.codes.length} countries in this list are named in a quote` +
            (named === 0 ? " (nothing backs the list itself)" : ""),
        );
      }
    }

    if (req.kind === "salary-floor") {
      const expected = route.destination === "SG" ? ["SGD", "month"] : ["JPY", "year"];
      if (req.currency !== expected[0] || req.period !== expected[1]) {
        errors.push(`${where}: ${route.destination} salaries must be ${expected.join(" per ")}`);
      }
      for (const row of req.byAge) {
        if (!quoted.has(String(row.amount)))
          errors.push(`${where}: salary table: ${row.amount} is not in any quote`);
        if (!quoted.has(String(row.age)))
          errors.push(`${where}: salary table: age ${row.age} is not in any quote`);
      }
      const ages = req.byAge.map((r) => r.age);
      if (ages.some((a, i) => i > 0 && a <= ages[i - 1]!))
        errors.push(`${where}: salary table rows must be sorted by age`);
    }
  }

  if (!route.verified) {
    (release ? errors : warnings).push(`${file}: not yet verified by a person`);
  } else if ((Date.now() - Date.parse(route.verified.on)) / 86_400_000 > STALE_DAYS) {
    warnings.push(`${file}: last verified ${route.verified.on}, over ${STALE_DAYS} days ago`);
  }
}

// A stamp can outlive the approvals behind it: edit a requirement on a verified route and the
// fingerprints stop matching, while the file goes on saying a person read it. The review server
// clears those on startup, but only if someone opens it, and `--release` is the gate that actually
// decides whether this publishes. So it checks here too.
//
// The approvals live in .review/state.json, which is gitignored, so CI has nothing to check
// against and says so rather than failing every verified route.
const reviewState = existsSync(join(import.meta.dirname, "..", ".review", "state.json"))
  ? loadState()
  : null;
if (reviewState) {
  for (const { file, route } of routes) {
    if (!route.verified) continue;
    const forRoute = reviewState[route.id] ?? {};
    const stale = route.requirements.filter((q) => !isApproved(forRoute[q.id], q));
    if (stale.length) {
      (release ? errors : warnings).push(
        `${file}: verified ${route.verified.on}, but ${stale.length} of ${route.requirements.length} ` +
          `requirements changed since they were approved (${stale.map((q) => q.id).join(", ")}). ` +
          `Run npm run review to re-read them.`,
      );
    }
  }
}

const reqs = routes.flatMap((r) => r.route.requirements);
// How much of the data the engine can actually decide from a profile. Everything else is `manual`
// and defers to the reader, the employer or the authority, which is honest but is not an answer.
// It is reported on every run because it is the number that says whether this beats a search: each
// requirement converted from `manual` to a typed kind is one more question answered here instead of
// handed back. On 2026-09-21 it was 16 of 94.
const decidable = reqs.filter((q) => q.kind !== "manual").length;
const verified = routes.filter((r) => r.route.verified);
const oldest = verified.map((r) => r.route.verified!.on).sort()[0] ?? "none";
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  `routes ${routes.length} · requirements ${reqs.length} · sourced ${reqs.filter((q) => q.sources.length).length}/${reqs.length}` +
    ` · decidable ${decidable}/${reqs.length}` +
    ` · verified ${verified.length}/${routes.length} · oldest verification ${oldest}` +
    (reviewState ? "" : " · stamps not cross-checked (no .review/state.json)"),
);
process.exit(errors.length ? 1 : 0);
